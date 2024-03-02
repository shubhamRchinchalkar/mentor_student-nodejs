const mongoose = require('mongoose')
require('dotenv').config()

const connectDB = async() => {
    try {
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser : true,
            useUnifiedTopology: true
        })
        console.log('Connected to mongo atlas')
    } catch (error) {
        console.error('Mongo connection error', error)
        process.exit(1)
    }
}

module.exports = connectDB;