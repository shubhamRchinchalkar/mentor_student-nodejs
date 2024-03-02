const express = require('express')
const bodyParser = require('body-parser')
const connectDB = require('./dbconfig')
const Mentor = require('./model/mentorModel')
const Student = require('./model/studentModel')

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json())
connectDB();

app.get('/', async (req, res) => {
    res.json({ message: `application successful` })
})

//API to create a mentor
app.post('/api/mentors', async (req, res) => {
    try {
        const mentor = await Mentor.create(req.body)
        res.json(mentor)
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' })
    }
})

//API to create a student 
app.post('/api/students', async (req, res) => {
    try {
      if (Array.isArray(req.body)) {
        const students = await Student.create(req.body);
        res.json(students);
      } else {
        const student = await Student.create(req.body);
        res.json(student);
      }
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

//API to assign student to a mentor
//a. select one mentor and add multiple students
app.post('/api/assign-students/:mentorId', async (req, res) => {
    try {
        const mentor = await Mentor.findById(req.params.mentorId)
        if (!mentor) return res.status(404).json({ error: 'Mentor not found' })

        const studentIds = req.body.studentIds;
        const students = await Student.find({ _id: { $in: studentIds }, mentor: { $exists: false } });

        mentor.students.push(...students.map(student => student._id));
        students.forEach(student => (student.mentor = mentor._id));

        await Promise.all([mentor.save(), ...students.map(student => student.save())]);

        res.json({ message: 'Students assigned to mentor successfully' });
    } catch (error) {
        res.status(500).json({error:'Internal server error'})
    }
})

//b. a student who has a mentor should not be shown in a list 
app.get('api/students-without-mentor', async (req, res) => {
    try {
        console.log('Fetching students without mentor...');
        const studentsWithoutMentor = await Student.find({ mentor: { $exists: false } });
        console.log('Students without mentor:', studentsWithoutMentor);
        res.json(studentsWithoutMentor);
      } catch (error) {
        console.error('Error fetching students without mentor:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    
})

//API to assign or change a mentor for a particular student
app.put('/api/assign-mentor/:studentId/:mentorId', async(req, res) => {
    try {
        const mentor = await Mentor.findById(req.params.mentorId)
        if(!mentor) return res.status(404).json({ error: 'Mentor not found' })

        const student = await Student.findById(req.params.studentId)
        if(!student) return res.status(404).json({ error: 'Student not found' })

        if(student.mentor){
            const previousMentor = await Mentor.findById(student.mentor)
            previousMentor.students.pull(student._id)
            await previousMentor.save()
        }

        mentor.students.push(student._id)
        student.mentor = mentor._id

        await Promise.all([mentor.save(), student.save()])

        res.json({ message: 'Mentor assigned to student successfully'})
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' })
    }
})

//API to show all students for a particular mentor
app.get('/api/mentor-students/:mentorId', async(req, res) => {
    try {
        const mentor = await Mentor.findById(req.params.mentorId).populate('students')
        if(!mentor) return res.status(404).json({ error: 'Mentor not found' })

        res.json(mentor.students)
    } catch (error) {
        res.status(500).json({ error:'Internal server error' })
    }
})

//Api to show the previously assigned mentor for a particular student
app.get('/api/previous-mentor/:studentId', async(req, res) => {
    try {
        const student = await Student.findById(req.params.studentId).populate('mentor')
        if(!student) return res.status(404).json({ error:'Student not found' })

        res.json(student.mentor)
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' })
    }
})

app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`)
})