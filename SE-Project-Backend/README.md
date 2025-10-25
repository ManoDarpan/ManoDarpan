# <span style="color:#6A1B9A">Backend</span>

<div align="center">
  <a href="https://manodarpan.netlify.app/" style="color:#8E24AA; text-decoration:none; font-weight:600">Visit Manodarpan • https://manodarpan.netlify.app/</a>
</div>

## Overview
Manodarpan Backend provides RESTful APIs for authentication, data persistence, sentiment analysis triggers, counsellor interactions and administrative operations.

## Tech Stack

- <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTglV8OKEUEbqJYaxunvJQJdhYKZHJ50X_67A&s" alt="MongoDB" width="36" style="vertical-align:middle; margin-right:8px"/> MongoDB (Mongoose)

- <img src="https://www.vhv.rs/dpng/d/546-5460201_node-js-logo-png-transparent-png.png" alt="Node.js" width="36" style="vertical-align:middle; margin-right:8px"/> Node.js

- <img src="https://upload.wikimedia.org/wikipedia/commons/6/64/Expressjs.png" alt="Express" width="36" style="vertical-align:middle; margin-right:8px"/> Express

- <img src="https://cdn.worldvectorlogo.com/logos/jwt-3.svg" alt="JWT" width="36" style="vertical-align:middle; margin-right:8px"/> JSON Web Tokens (JWT)

- <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJj5k4jEbCPsdaAt2utZ7kzwSuAwC4NOMDKGK1OuKUzeaXFddduuVQnMFQLQYZ2sbd4yE&usqp=CAU" alt="bcrypt" width="36" style="vertical-align:middle; margin-right:8px"/> bcrypt

- <img src="https://raw.githubusercontent.com/cdimascio/dotenv-kotlin/master/assets/kotlin-dotenv-logo.png" alt="dotenv" width="36" style="vertical-align:middle; margin-right:8px"/> dotenv

- <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSoZAPhkIP75IVa4trptoEfFlzk-0KFEm0ibg&s" alt="Postman" width="36" style="vertical-align:middle; margin-right:8px"/> Postman (API testing)

## Testing
APIs were tested manually using Postman. Tests covered authentication flows, CRUD for users/moods/journals, counsellor booking flows and admin routes. Postman collection is available on request.

## Important Modules
- auth/ — registration, login, JWT issuance, password reset  
- users/ — profiles, preferences, onboarding  
- moods/ — daily tracking, mood entries, analytics endpoints  
- journals/ — secure journaling CRUD, privacy/export controls  
- counsellor/ — counsellor profiles, booking, messaging hooks  
- insights/ — "The Mirror" engine: pattern detection & summaries  
- sentiment/ — sentiment analysis service (text processing + model integration)  
- admin/ — user management, content moderation, analytics  
- middlewares/ — auth checks, validation, error handlers, rate limiting  
- utils/ — email, notifications, cron jobs, schedulers

## Contributors
- Akshat Jaipuriar — Backend Development
- Ayush Rewanshete — Backend Assistance

