FROM callmenaul/raw-python-server:v1.0

WORKDIR /app

# Copy the rest of the application
COPY ./backend.py ./
COPY model_weights.pth .

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "backend:app", "--host", "0.0.0.0", "--port", "8000"] 
