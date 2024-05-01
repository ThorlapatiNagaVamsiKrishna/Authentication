const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
app = express()
app.use(express.json())
const userDatabsePath = path.join(__dirname, 'userData.db')
let userDatabse = null

const intializeAndConnectServer = async () => {
  try {
    userDatabse = await open({
      filename: userDatabsePath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB Error:${e.message}`)
  }
}
intializeAndConnectServer()

// create and register new user

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const getExistingUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const dbUser = await userDatabse.get(getExistingUserQuery)

  // If the registrant provides a password with less than 5 characters

  if (password.length < 5) {
    response.status(400)
    response.send('Password is too short')
  } else {
    if (dbUser === undefined) {
      const hashedPassword = await bcrypt.hash(request.body.password, 10)
      const createUserQuery = `
      INSERT INTO user (username, name, password, gender, location)
      VALUES('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}');`
      const dbResponse = await userDatabse.run(createUserQuery)
      response.status(200)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('User already exists')
    }
  }
})

// login user with username and password

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const getUserDetails = `SELECT * FROM user WHERE username = '${username}';`
  const dbUser = await userDatabse.get(getUserDetails)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const convertUserPassword = await bcrypt.compare(password, dbUser.password)
    if (convertUserPassword === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

// Change password and create new password

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const getUserDetails = `SELECT * FROM user WHERE username = '${username}';`
  const dbUser = await userDatabse.get(getUserDetails)
  const actualPassword = await bcrypt.compare(oldPassword, dbUser.password)
  const hashedNewPassword = await bcrypt.hash(newPassword, 10)
  if (newPassword.length < 5) {
    response.status(400)
    response.send('Password is too short')
  } else {
    if (actualPassword === true) {
      const updatePasswordQuery = `
    UPDATE user 
    SET password = '${hashedNewPassword}';`
      const resultPassword = await userDatabse.run(updatePasswordQuery)
      response.status(200)
      response.send('Password updated')
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})
module.exports = app
