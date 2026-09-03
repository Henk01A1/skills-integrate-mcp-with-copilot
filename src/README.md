# Mergington High School Activities API

A super simple FastAPI application that allows students to view and sign up for extracurricular activities.

## Features

- View all available extracurricular activities
- Sign up for activities
- Create a student account, sign in, and update a profile

## Getting Started

1. Install the dependencies:

   ```
   pip install fastapi uvicorn
   ```

2. Run the application:

   ```
   python app.py
   ```

3. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## API Endpoints

| Method | Endpoint                                                          | Description                                                         |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/activities`                                                     | Get all activities with their details and current participant count |
| POST   | `/auth/register`                                                  | Create a student account and sign in                                |
| POST   | `/auth/login`                                                     | Sign in and receive a bearer token                                  |
| GET    | `/auth/me`                                                        | Get the signed-in student's profile                                 |
| PUT    | `/auth/me`                                                        | Update the signed-in student's name and grade                        |
| POST   | `/auth/logout`                                                    | Invalidate the current bearer token                                 |
| POST   | `/activities/{activity_name}/signup`                              | Sign up the authenticated student for an activity                   |
| DELETE | `/activities/{activity_name}/unregister`                          | Unregister the authenticated student                                |

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level

All data is stored in memory, which means data will be reset when the server restarts.
