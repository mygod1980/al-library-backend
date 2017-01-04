
# Backend Part of AL Library
## Installation Guide

1. Make sure you have 
 - [NodeJS](https://nodejs.org/) 
 - [MongoDB](https://www.mongodb.org/)
 - [Git](https://git-scm.com/)
 
 installed on your PC.
2. In order to set up the project on your local machine, you need to pull it from repo.  Open the command line or terminal and type
    ```
    git clone https://github.com/mygod1980/al-library-backend.git
    ```
3. Now you've got the project on your PC. Type 
4. 
    ```
    cd al-library-backend
    ```
    to go to that directory
4. Install the dependencies via npm:
 Install [Gulp](http://gulpjs.com/) globally:

	```
	npm install -g bower gulp
	```
 	After that install  dependencies
    ```
    npm install
    ```
5. Run the server:

    ```
    npm start
    ```
 
6. Testing. We use BBD. To run tests you need to set up testing server, perform migration in testing DB

    Run migration
    
    ```
    env NODE_ENV=test  gulp migrate
    ```
    
    Run testing server
    
    ```
    env NODE_ENV=test npm start
    ```
    Run the tests
    ```
    npm test
    ```