from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import shutil
import os
import tempfile
import torch
import nibabel as nib
import torch.nn.functional as F
from scipy.ndimage import gaussian_filter

# ==================================================================================================

import torch.nn as nn
import pytorch_lightning as pl
from torchmetrics import Accuracy, MeanAbsoluteError
from torchvision.models.video import r3d_18, R3D_18_Weights


import numpy as np
from torchmetrics.classification import BinarySpecificity, BinaryRecall
from torchmetrics.classification import MulticlassSpecificity, MulticlassRecall


def rmse_tt(predictions, targets):
    mse = F.mse_loss(predictions, targets)
    return torch.sqrt(mse)


class GradNormOptimizer:
    def __init__(self, model, num_tasks=2, alpha=1.5):
        self.model = model
        self.num_tasks = num_tasks
        self.alpha = alpha
        self.initial_losses = None
        self.task_weights = nn.Parameter(torch.ones(num_tasks, requires_grad=True))
        self.weights_optimizer = torch.optim.Adam([self.task_weights], lr=0.025)

    def to(self, device):
        self.task_weights = self.task_weights.to(device)
        return self

    def compute_grad_norm_loss(self, losses, shared_params):
        if self.initial_losses is None:
            self.initial_losses = [loss.item() for loss in losses]

        L_ratio = torch.stack(
            [loss / init_loss for loss, init_loss in zip(losses, self.initial_losses)]
        )
        L_mean = torch.mean(L_ratio)
        r_weights = L_ratio / L_mean

        grad_norms = []
        for i, loss in enumerate(losses):
            grads = torch.autograd.grad(loss, shared_params, retain_graph=True)
            grad_norm = torch.norm(torch.stack([g.norm() for g in grads]))
            grad_norms.append(grad_norm)

        grad_norms = torch.stack(grad_norms)
        mean_norm = torch.mean(grad_norms)

        target_grad_norm = grad_norms * (r_weights**self.alpha)
        gradnorm_loss = torch.sum(torch.abs(grad_norms - target_grad_norm))

        return gradnorm_loss

    def update_weights(self, losses, shared_params):
        gradnorm_loss = self.compute_grad_norm_loss(losses, shared_params)

        self.weights_optimizer.zero_grad()
        gradnorm_loss.backward(retain_graph=True)
        self.weights_optimizer.step()

        normalized_weights = F.softmax(self.task_weights, dim=0)
        return normalized_weights


class CombinedOptimizer:
    def __init__(
        self,
        model,
        num_tasks=2,
        frank_wolfe_weight=0.5,
        initial_lambda=0.5,
        alpha=1.5,
        eta=0.1,
    ):
        self.frank_wolfe = FrankWolfeOptimizer(num_tasks)
        self.gradnorm = GradNormOptimizer(model, num_tasks, alpha)
        self.lambda_param = initial_lambda  # Initial lambda value
        self.weights = torch.ones(num_tasks) / num_tasks
        self.device = None
        self.eta = eta  # Learning rate for lambda adaptation

    def to(self, device):
        self.device = device
        self.frank_wolfe.to(device)
        self.gradnorm.to(device)
        self.weights = self.weights.to(device)
        return self

    def update_weights(self, losses, shared_params):
        gn_weights = self.gradnorm.update_weights(losses, shared_params)
        fw_weights = self.frank_wolfe.update_weights(losses)
        grad_norms = []
        for i, loss in enumerate(losses):
            grads = torch.autograd.grad(loss, shared_params, retain_graph=True)
            grad_norm = torch.norm(torch.stack([g.norm() for g in grads]))
            grad_norms.append(grad_norm)

        grad_norms = torch.stack(grad_norms)
        loss_values = torch.stack([loss.detach() for loss in losses])
        loss_weights = F.softmax(loss_values, dim=0)

        target_balance = loss_weights
        current_balance = F.softmax(grad_norms, dim=0)

        grad_diff = torch.sum(torch.abs(current_balance - target_balance))

        delta_lambda = self.eta * grad_diff * 2.0  # Scale up for more movement

        min_change = 0.01
        if delta_lambda < min_change:
            delta_lambda = torch.tensor(min_change)

        if grad_norms[0] > grad_norms[1]:  # Classification needs less weight
            self.lambda_param = max(
                0.1, min(0.9, self.lambda_param - delta_lambda.item())
            )
        else:  # Regression needs less weight
            self.lambda_param = max(
                0.1, min(0.9, self.lambda_param + delta_lambda.item())
            )

        combined_weights = (
            self.lambda_param * fw_weights + (1 - self.lambda_param) * gn_weights
        )

        self.last_lambda = self.lambda_param
        self.last_grad_diff = grad_diff.item()

        self.weights = F.softmax(combined_weights, dim=0)
        return self.weights

    def get_lambda_info(self):
        return {
            "lambda": self.lambda_param,
            "gradient_difference": getattr(self, "last_grad_diff", 0),
        }


class FrankWolfeOptimizer:
    def __init__(self, num_tasks=2, max_iter=10, beta=0.1):
        self.num_tasks = num_tasks
        self.max_iter = max_iter
        self.weights = None
        self.device = None
        self.beta = beta
        self.iteration = 0
        self.loss_history = []

    def to(self, device):
        self.device = device
        if self.weights is None:
            self.weights = (torch.ones(self.num_tasks) / self.num_tasks).to(device)
        else:
            self.weights = self.weights.to(device)
        return self

    def compute_gradient(self, losses, prev_weights):
        losses_tensor = torch.stack([loss.detach() for loss in losses])
        log_losses = torch.log(1 + losses_tensor)
        return 0.9 * log_losses + 0.1 * prev_weights

    def compute_gamma(self, losses):
        L_mean = torch.mean(torch.stack([loss.detach() for loss in losses]))
        base_gamma = min(1.0, 2.0 / (self.iteration + 2))
        return base_gamma * torch.exp(-self.beta * L_mean)

    def solve_linear_problem(self, gradients):
        min_idx = torch.argmin(gradients)
        s = torch.zeros_like(self.weights, device=self.device)
        s[min_idx] = 1.0
        return s

    def update_weights(self, losses):
        if self.weights is None:
            self.device = losses[0].device
            self.weights = (torch.ones(self.num_tasks) / self.num_tasks).to(self.device)

        prev_weights = self.weights.clone()

        gradients = self.compute_gradient(losses, prev_weights)

        s = self.solve_linear_problem(gradients)

        gamma = self.compute_gamma(losses)
        log_barrier = torch.log(1 + s)
        new_weights = (1 - gamma) * prev_weights + gamma * log_barrier

        self.weights = F.softmax(new_weights, dim=0)

        self.iteration += 1
        self.loss_history.append([loss.item() for loss in losses])

        return self.weights


class AttentionGatingModule(nn.Module):
    def __init__(self, feature_dim):
        super(AttentionGatingModule, self).__init__()
        self.attention = nn.Sequential(
            nn.LayerNorm(feature_dim),
            nn.Linear(feature_dim, feature_dim // 2),
            nn.GELU(),  # Changed to GELU
            nn.Dropout(0.2),
            nn.Linear(feature_dim // 2, feature_dim),
            nn.Sigmoid(),
        )

        self.residual = nn.Sequential(
            nn.Linear(feature_dim, feature_dim), nn.LayerNorm(feature_dim)
        )

    def forward(self, shared_features, task_specific_features):
        if shared_features.size(1) != task_specific_features.size(1):
            task_specific_features = F.linear(
                task_specific_features,
                torch.eye(shared_features.size(1)).to(task_specific_features.device),
            )

        attention_weights = self.attention(shared_features)
        gated_features = (
            shared_features * attention_weights
            + task_specific_features * (1 - attention_weights)
        )

        residual = self.residual(gated_features)
        return gated_features + residual


class MultiTaskAlzheimerModel(pl.LightningModule):
    def __init__(
        self,
        num_classes=2,
        input_shape=(1, 64, 64, 64),
        metadata_dim=2,
        pretrained=True,
    ):
        super(MultiTaskAlzheimerModel, self).__init__()

        if pretrained:
            self.backbone = r3d_18(weights=R3D_18_Weights.DEFAULT)
        else:
            self.backbone = r3d_18(weights=None)

        self.backbone.stem[0] = nn.Conv3d(
            input_shape[0],
            64,
            kernel_size=(7, 7, 7),
            stride=(2, 2, 2),
            padding=(3, 3, 3),
            bias=False,
        )

        self.backbone = nn.Sequential(*list(self.backbone.children())[:-1])
        self.metadata_embedding = nn.Sequential(
            nn.Linear(metadata_dim, 256),
            nn.LayerNorm(256),
            nn.GELU(),
            nn.Dropout(0.2),
            nn.Linear(256, 128),
            nn.LayerNorm(128),
        )

        # Enhanced cross attention
        self.cross_attention = nn.Sequential(
            nn.Linear(512 + 128, 512),
            nn.LayerNorm(512),
            nn.GELU(),
            nn.Dropout(0.2),
            nn.Linear(512, 512),
            nn.LayerNorm(512),
        )

        # Enhanced shared representation
        self.shared_representation = nn.Sequential(
            nn.Linear(512, 1024),
            nn.LayerNorm(1024),
            nn.GELU(),
            nn.Dropout(0.3),
            nn.Linear(1024, 1024),
            nn.LayerNorm(1024),
        )

        self.classification_gate = AttentionGatingModule(1024)
        self.classification_branch = nn.Sequential(
            nn.Linear(1024, 512),
            nn.LayerNorm(512),
            nn.GELU(),
            nn.Dropout(0.3),
            nn.Linear(512, 256),
            nn.LayerNorm(256),
            nn.GELU(),
            nn.Dropout(0.2),
            nn.Linear(256, num_classes),
        )

        self.regression_gate = AttentionGatingModule(1024)
        self.regression_branch = nn.Sequential(
            nn.Linear(1024, 512),
            nn.LayerNorm(512),
            nn.GELU(),
            nn.Dropout(0.3),
            nn.Linear(512, 256),
            nn.LayerNorm(256),
            nn.GELU(),
            nn.Dropout(0.2),
            nn.Linear(256, 1),
        )

        # Metrics
        self.train_classification_accuracy = Accuracy(
            task="multiclass", num_classes=num_classes
        )
        self.val_classification_accuracy = Accuracy(
            task="multiclass", num_classes=num_classes
        )
        self.test_classification_accuracy = Accuracy(
            task="multiclass", num_classes=num_classes
        )
        self.mmse_mae = MeanAbsoluteError()

        self.classification_loss = nn.CrossEntropyLoss(label_smoothing=0.1)
        self.regression_loss = nn.HuberLoss()
        self.multi_task_optimizer = CombinedOptimizer(
            self, num_tasks=2, frank_wolfe_weight=0.4, alpha=1.5
        )

        if num_classes > 2:
            self.specificity = MulticlassSpecificity(num_classes=num_classes)
            self.sensitivity = MulticlassRecall(num_classes=num_classes)
        else:
            self.specificity = BinarySpecificity()
            self.sensitivity = BinaryRecall()

        self.test_predictions = []
        self.test_labels = []
        self.test_mmse_true = []
        self.test_mmse_pred = []

        self.loss_history = {
            "epochs": [],
            "total": [],
            "classification": [],
            "regression": [],
            "weights": [],
            "lambda_values": [],
            "grad_norms_classification": [],
            "grad_norms_regression": [],
        }

        self._init_weights()
        self.num_AD = 0
        self.num_CN = 0
        self.num_MCI = 0
        self.current_epoch_idx = 0

    def _init_weights(self):
        for m in self.modules():
            if isinstance(m, nn.Linear):
                nn.init.kaiming_normal_(m.weight, mode="fan_out", nonlinearity="relu")
                if m.bias is not None:
                    nn.init.constant_(m.bias, 0)
            elif isinstance(m, nn.LayerNorm):
                nn.init.constant_(m.weight, 1)
                nn.init.constant_(m.bias, 0)

    def on_fit_start(self):
        self.multi_task_optimizer.to(self.device)

    def forward(self, image, metadata):
        x = self.backbone(image)
        image_features = x.squeeze(-1).squeeze(-1).squeeze(-1)

        metadata_features = self.metadata_embedding(metadata)
        fused_features = self.cross_attention(
            torch.cat([image_features, metadata_features], dim=1)
        )
        shared_features = self.shared_representation(fused_features)
        classification_features = self.classification_gate(
            shared_features, shared_features
        )
        classification_output = self.classification_branch(classification_features)

        regression_features = self.regression_gate(shared_features, shared_features)
        regression_output = self.regression_branch(regression_features)

        return classification_output, regression_output

    def training_step(self, batch, batch_idx):
        image, label, mmse, age, gender = (
            batch["image"],
            batch["label"],
            batch["mmse"],
            batch["age"],
            batch["gender"],
        )
        metadata = torch.stack([age, gender], dim=1).float()

        classification_output, regression_output = self(image, metadata)

        classification_loss = self.classification_loss(classification_output, label)
        regression_loss = self.regression_loss(regression_output.squeeze(), mmse)

        classification_loss.backward(retain_graph=True)
        grad_norm_classification = torch.norm(
            torch.stack(
                [torch.norm(p.grad) for p in self.parameters() if p.grad is not None]
            )
        )
        self.zero_grad()

        regression_loss.backward(retain_graph=True)
        grad_norm_regression = torch.norm(
            torch.stack(
                [torch.norm(p.grad) for p in self.parameters() if p.grad is not None]
            )
        )
        self.zero_grad()

        shared_params = list(self.shared_representation.parameters())

        losses = [classification_loss.to(self.device), regression_loss.to(self.device)]
        weights = self.multi_task_optimizer.update_weights(losses, shared_params)

        total_loss = torch.sum(torch.stack(losses) * weights)

        preds = torch.argmax(classification_output, dim=1)
        acc = (preds == label).float().mean()

        self.log("train_loss", total_loss, on_step=True, on_epoch=True, prog_bar=True)
        self.log(
            "train_classification_loss",
            classification_loss,
            on_step=True,
            on_epoch=True,
        )
        self.log("train_regression_loss", regression_loss, on_step=True, on_epoch=True)
        self.log(
            "train_classification_acc", acc, on_step=True, on_epoch=True, prog_bar=True
        )
        self.log("train_classification_weight", weights[0], on_step=True, on_epoch=True)
        self.log("train_regression_weight", weights[1], on_step=True, on_epoch=True)
        lambda_info = self.multi_task_optimizer.get_lambda_info()

        self.log("train_lambda", lambda_info["lambda"], on_step=True, on_epoch=True)
        self.log(
            "train_gradient_difference",
            lambda_info["gradient_difference"],
            on_step=True,
            on_epoch=True,
        )

        return total_loss

    def on_train_epoch_end(self):
        self.loss_history["epochs"].append(self.current_epoch_idx)

        avg_total_loss = self.trainer.callback_metrics.get("train_loss_epoch", 0)
        avg_class_loss = self.trainer.callback_metrics.get(
            "train_classification_loss_epoch", 0
        )
        avg_reg_loss = self.trainer.callback_metrics.get(
            "train_regression_loss_epoch", 0
        )
        avg_lambda = self.trainer.callback_metrics.get("train_lambda_epoch", 0)

        if hasattr(avg_total_loss, "item"):
            avg_total_loss = avg_total_loss.item()
        if hasattr(avg_class_loss, "item"):
            avg_class_loss = avg_class_loss.item()
        if hasattr(avg_reg_loss, "item"):
            avg_reg_loss = avg_reg_loss.item()
        if hasattr(avg_lambda, "item"):
            avg_lambda = avg_lambda.item()

        self.loss_history["total"].append(avg_total_loss)
        self.loss_history["classification"].append(avg_class_loss)
        self.loss_history["regression"].append(avg_reg_loss)
        self.loss_history["lambda_values"].append(avg_lambda)

        # self.plot_loss_curves()
        # self.plot_lambda_curve()

        self.current_epoch_idx += 1

    # def plot_loss_curves(self):
    #     """Plot and log loss curves to wandb"""
    #     fig, ax = plt.subplots(figsize=(10, 6))

    #     if len(self.loss_history['epochs']) > 0:
    #         ax.plot(self.loss_history['epochs'], self.loss_history['total'],
    #                label='Total Loss', marker='o')
    #         ax.plot(self.loss_history['epochs'], self.loss_history['classification'],
    #                label='Classification Loss', marker='s')
    #         ax.plot(self.loss_history['epochs'], self.loss_history['regression'],
    #                label='Regression Loss', marker='^')

    #         ax.set_xlabel('Epoch')
    #         ax.set_ylabel('Loss')
    #         ax.set_title('Training Loss Convergence')
    #         ax.legend()
    #         ax.grid(True)

    #         # self.logger.experiment.log({"Training Loss Curves": wandb.Image(fig)})

    #     plt.close(fig)
    # def plot_lambda_curve(self):
    #     # """Plot and log lambda parameter changes to wandb"""
    #     if len(self.loss_history['epochs']) > 0:
    #         fig, ax = plt.subplots(figsize=(10, 6))

    #         ax.plot(self.loss_history['epochs'], self.loss_history['lambda_values'],
    #                label='Lambda Parameter', marker='o', color='purple')

    #         ax.set_xlabel('Epoch')
    #         ax.set_ylabel('Lambda Value')
    #         ax.set_title('Lambda Parameter Changes Over Training')
    #         ax.set_ylim([0, 1])  # Lambda is between 0 and 1
    #         ax.grid(True)
    #         ax.legend()

    # Log to wandb
    # self.logger.experiment.log({"Lambda Parameter Curve": wandb.Image(fig)})

    # plt.close(fig)

    def validation_step(self, batch, batch_idx):
        image, label, mmse, age, gender = (
            batch["image"],
            batch["label"],
            batch["mmse"],
            batch["age"],
            batch["gender"],
        )
        metadata = torch.stack([age, gender], dim=1).float()

        classification_output, regression_output = self(image, metadata)

        classification_loss = self.classification_loss(classification_output, label)
        regression_loss = self.regression_loss(regression_output.squeeze(), mmse)

        losses = [classification_loss.to(self.device), regression_loss.to(self.device)]
        weights = self.multi_task_optimizer.weights

        total_loss = torch.sum(torch.stack(losses) * weights)

        preds = torch.argmax(classification_output, dim=1)
        acc = (preds == label).float().mean()
        lambda_info = self.multi_task_optimizer.get_lambda_info()
        self.log("val_lambda", lambda_info["lambda"], on_epoch=True, sync_dist=True)
        self.log("val_loss", total_loss, on_epoch=True, prog_bar=True, sync_dist=True)
        self.log(
            "val_classification_loss",
            classification_loss,
            on_epoch=True,
            sync_dist=True,
        )
        self.log("val_regression_loss", regression_loss, on_epoch=True, sync_dist=True)
        self.log(
            "val_classification_acc", acc, on_epoch=True, prog_bar=True, sync_dist=True
        )
        self.log("val_classification_weight", weights[0], on_epoch=True, sync_dist=True)
        self.log("val_regression_weight", weights[1], on_epoch=True, sync_dist=True)

        return total_loss

    def test_step(self, batch, batch_idx):
        image, label, mmse, age, gender = (
            batch["image"],
            batch["label"],
            batch["mmse"],
            batch["age"],
            batch["gender"],
        )

        # for ij in label:
        #     label1 = ij.item()
        #     if label1 == 0:
        #         self.num_AD += 1
        #     elif label1 == 1:
        #         self.num_CN += 1
        #     else:
        #         self.num_MCI += 1

        metadata = torch.stack([age, gender], dim=1).float()
        classification_output, regression_output = self(image, metadata)

        classification_loss = self.classification_loss(classification_output, label).to(
            self.device
        )
        regression_loss = self.regression_loss(regression_output.squeeze(), mmse).to(
            self.device
        )

        weights = self.multi_task_optimizer.weights
        total_loss = torch.sum(
            torch.stack([classification_loss, regression_loss]) * weights
        )

        preds = torch.argmax(classification_output, dim=1)
        acc = (preds == label).float().mean()
        mae = F.l1_loss(regression_output.squeeze(), mmse)
        rmse = rmse_tt(regression_output.squeeze(), mmse)
        spec = self.specificity(preds, label)
        sens = self.sensitivity(preds, label)

        # Log metrics
        self.log("test_total_loss", total_loss, on_epoch=True)
        self.log("test_classification_loss", classification_loss, on_epoch=True)
        self.log("test_regression_loss", regression_loss, on_epoch=True)
        self.log("test_classification_acc", acc, on_epoch=True, prog_bar=True)
        self.log("test_regression_mae", mae, on_epoch=True, prog_bar=True)
        self.log("test_regression_rmse", rmse, on_epoch=True, prog_bar=True)
        self.log("final_classification_weight", weights[0], on_epoch=True)
        self.log("final_regression_weight", weights[1], on_epoch=True)
        self.log("test_specificity", spec, on_epoch=True, prog_bar=True)
        self.log("test_sensitivity", sens, on_epoch=True, prog_bar=True)

        self.test_predictions.append(preds.cpu())
        self.test_labels.append(label.cpu())
        self.test_mmse_true.append(mmse.cpu())
        self.test_mmse_pred.append(regression_output.squeeze().cpu())

        return {
            "preds": preds,
            "true_labels": label,
            "predicted_mmse": regression_output.squeeze(),
            "true_mmse": mmse,
            "final_weights": weights.cpu(),
            "specificity": spec,
            "sensitivity": sens,
        }

    def on_test_start(self):
        self.test_predictions = []
        self.test_labels = []
        self.test_mmse_true = []
        self.test_mmse_pred = []
        self.num_AD = 0
        self.num_CN = 0
        self.num_MCI = 0

    def on_test_end(self):
        # print("============================================")
        # print(f"Number of AD samples: {self.num_AD}")
        # print(f"Number of CN samples: {self.num_CN}")
        # print(f"Number of MCI samples: {self.num_MCI}")
        # print("============================================")

        all_preds = torch.cat(self.test_predictions).numpy()
        all_labels = torch.cat(self.test_labels).numpy()

        all_true_mmse = torch.cat(self.test_mmse_true).numpy()
        fixed_mmse_pred = []
        for tensor in self.test_mmse_pred:
            if tensor.dim() == 0:  # Nếu là tensor 0 chiều
                fixed_mmse_pred.append(
                    tensor.unsqueeze(0)
                )  # Chuyển thành tensor 1 chiều
            else:
                fixed_mmse_pred.append(tensor)

        all_pred_mmse = torch.cat(fixed_mmse_pred).numpy()

        if hasattr(self, "num_classes") and self.num_classes > 2:
            class_names = ["AD", "CN", "MCI"]
        else:
            class_names = ["AD", "CN"]

        # self.plot_mmse_predictions(all_true_mmse, all_pred_mmse)

        lambda_value = self.multi_task_optimizer.lambda_param
        weights = self.multi_task_optimizer.weights.detach().cpu().numpy()

        # fig, ax = plt.subplots(figsize=(10, 6))

        # ax.bar(['Classification', 'Regression'], weights, color=['blue', 'green'])
        # ax.set_title(f'Final Task Weights (Lambda = {lambda_value:.3f})')
        # ax.set_ylabel('Weight Value')
        # ax.set_ylim([0, 1])

        # ax.axhline(y=lambda_value, color='r', linestyle='--',
        #          label=f'λ = {lambda_value:.3f}')
        # ax.legend()

    def configure_optimizers(self):
        optimizer = torch.optim.Adam(self.parameters(), lr=1e-3)
        scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
            optimizer, mode="min", factor=0.1, patience=5
        )
        return {
            "optimizer": optimizer,
            "lr_scheduler": {"scheduler": scheduler, "monitor": "val_loss"},
        }


# =================================================================================================
app = FastAPI(title="Alzheimer's Disease Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictionResponse(BaseModel):
    predicted_class: int
    class_name: str
    cn_probability: float
    ad_probability: float
    predicted_mmse: float


def normalize(img):
    if isinstance(img, torch.Tensor):
        min_val = img.min()
        max_val = img.max()
        return (img - min_val) / (max_val - min_val + 1e-8)
    else:
        min_val = np.min(img)
        max_val = np.max(img)
        return (img - min_val) / (max_val - min_val + 1e-8)


def smoothing(img, sigma=1.0):
    # Apply Gaussian smoothing
    if isinstance(img, torch.Tensor):
        img_np = img.numpy()
        smoothed_img = gaussian_filter(img_np, sigma=sigma)
        return torch.tensor(smoothed_img, dtype=torch.float32)
    else:
        return gaussian_filter(img, sigma=sigma)


def preprocess_mri_image(image_path, target_shape=(64, 64, 64)):

    img = nib.load(image_path)
    img_data = img.get_fdata()

    img_tensor = torch.tensor(img_data, dtype=torch.float32).unsqueeze(0)

    if img_tensor.shape[1:] != target_shape:
        img_tensor = F.interpolate(
            img_tensor.unsqueeze(0),
            size=target_shape,
            mode="trilinear",
            align_corners=False,
        ).squeeze(0)

    img_tensor = normalize(img_tensor)
    img_tensor = smoothing(img_tensor)

    if img_tensor.dim() == 3:
        img_tensor = img_tensor.unsqueeze(0)
    if img_tensor.dim() == 4:
        img_tensor = img_tensor.unsqueeze(0)

    return img_tensor


def load_model(weights_path, device="cuda"):
    model = MultiTaskAlzheimerModel(num_classes=2)
    model.load_state_dict(torch.load(weights_path, map_location=device))
    model.to(device)
    model.eval()
    return model


model = None
device = None


@app.on_event("startup")
async def startup_event():
    global model, device
    # device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    device = torch.device("cpu")

    print(f"Using device: {device}")
    try:
        model_path = "model_weights.pth"
        model = load_model(model_path, device)
        print("Model loaded successfully!")
    except Exception as e:
        print(f"Error loading model: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load model: {str(e)}")


@app.post("/predict/", response_model=PredictionResponse)
async def predict_alzheimer(
    mri_file: UploadFile = File(...), age: float = Form(...), gender: float = Form(...)
):
    global model, device

    if not model:
        raise HTTPException(status_code=500, detail="Model not loaded")

    if not mri_file.filename.endswith((".nii", ".nii.gz")):
        raise HTTPException(
            status_code=400, detail="Only .nii or .nii.gz files are accepted"
        )

    with tempfile.NamedTemporaryFile(delete=False, suffix=".nii") as temp_file:
        temp_path = temp_file.name
        shutil.copyfileobj(mri_file.file, temp_file)

    try:
        image_tensor = preprocess_mri_image(temp_path)
        image_tensor = image_tensor.to(device)

        metadata = torch.tensor([[float(age), float(gender)]], dtype=torch.float32).to(
            device
        )

        with torch.no_grad():
            classification_logits, mmse_pred = model(image_tensor, metadata)
            class_probs = torch.softmax(classification_logits, dim=1)
            predicted_class = torch.argmax(class_probs, dim=1).item()

            class_probabilities = class_probs[0].cpu().numpy()
            cn_probability = float(class_probabilities[1] * 100)
            ad_probability = float(class_probabilities[0] * 100)

            mmse_prediction = float(mmse_pred.item())

        class_name = (
            "AD (Alzheimer's Disease)" if predicted_class == 0 else "CN (Normal)"
        )
        response = {
            "predicted_class": predicted_class,
            "class_name": class_name,
            "cn_probability": cn_probability,
            "ad_probability": ad_probability,
            "predicted_mmse": mmse_prediction,
        }

        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

    finally:
        if os.path.exists(temp_path):
            os.unlink(temp_path)


@app.get("/health")
async def health_check():
    return {"status": "ok", "model_loaded": model is not None}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
