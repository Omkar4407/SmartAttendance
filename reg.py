import cv2
import os

name = input("Enter your name: ").strip().lower()
path = 'images'

if not os.path.exists(path):
    os.makedirs(path)

cam = cv2.VideoCapture(0)
print("Look at the camera. Capturing in 3 seconds...")
cv2.waitKey(3000)

ret, frame = cam.read()
if ret:
    cv2.imwrite(f"{path}/{name}.jpg", frame)
    print(f"Image saved as {name}.jpg")
else:
    print("Failed to capture image.")
cam.release()
cv2.destroyAllWindows()
