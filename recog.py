import face_recognition
import cv2
import os
import numpy as np
from datetime import datetime
import csv

# Load known faces
known_encodings = []
known_names = []

path = 'images'
for filename in os.listdir(path):
    if filename.endswith(".jpg"):
        image = face_recognition.load_image_file(f"{path}/{filename}")
        encoding = face_recognition.face_encodings(image)
        if encoding:
            known_encodings.append(encoding[0])
            known_names.append(os.path.splitext(filename)[0])

# Start webcam
cap = cv2.VideoCapture(0)
marked_names = set()

def mark_attendance(name):
    now = datetime.now()
    dt_string = now.strftime('%Y-%m-%d %H:%M:%S')
    with open('attendance.csv', 'a', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([name, dt_string])
        print(f"Marked {name} at {dt_string}")

print("Press 'q' to quit.")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
    rgb_small = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)

    face_locations = face_recognition.face_locations(rgb_small)
    face_encodings = face_recognition.face_encodings(rgb_small, face_locations)

    for encoding in face_encodings:
        matches = face_recognition.compare_faces(known_encodings, encoding)
        face_distances = face_recognition.face_distance(known_encodings, encoding)
        best_match = np.argmin(face_distances)

        if matches[best_match]:
            name = known_names[best_match]
            if name not in marked_names:
                mark_attendance(name)
                marked_names.add(name)

    # Show the frame
    cv2.imshow('Face Recognition - Attendance', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
