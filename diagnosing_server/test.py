import requests
import os

API_URL = "http://localhost:8000/predict/"

def test_predict_alzheimer(mri_file_path, age, gender):
    """
    Test the Alzheimer's prediction API
    
    Args:
        mri_file_path (str): Path to the MRI file (.nii or .nii.gz)
        age (float): Patient age
        gender (float): Patient gender (0 for female, 1 for male)
    """
    # Check if file exists
    if not os.path.exists(mri_file_path):
        print(f"Error: File {mri_file_path} not found.")
        return
    
    # Prepare form data
    files = {
        'mri_file': (os.path.basename(mri_file_path), open(mri_file_path, 'rb'), 'application/octet-stream')
    }
    
    data = {
        'age': str(age),
        'gender': str(gender)
    }
    
    try:
        # Make POST request to API
        response = requests.post(API_URL, files=files, data=data)
        
        # Check if request was successful
        if response.status_code == 200:
            result = response.json()
            print("\nAlzheimer's Disease Prediction Results:")
            print(f"Classification: {result['class_name']}")
            print(f"Normal (CN) Probability: {result['cn_probability']:.2f}%")
            print(f"Alzheimer's Disease (AD) Probability: {result['ad_probability']:.2f}%")
            print(f"Predicted MMSE Score: {result['predicted_mmse']:.2f}")
            return result
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
            return None
            
    except Exception as e:
        print(f"Request failed: {str(e)}")
        return None
    
if __name__ == "__main__":
    # Example usage
    mri_file = "./cn.nii"  # Update with your file path
    age = 65.0
    gender = 0.0 
    
    test_predict_alzheimer(mri_file, age, gender)
