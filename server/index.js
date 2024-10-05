const express = require('express');
const https = require('https');
const fs = require('fs');
const app = express();
const cors = require('cors');
const { default: mongoose } = require('mongoose');
const dotenv = require('dotenv').config();
const User = require('./models/user');
const Post = require('./models/post');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const uploadMiddleware = multer({ dest: 'uploads/' });
const fs = require('fs');

const secret = process.env.JWT_SECRET;
const salt = bcrypt.genSaltSync(10);
async function connectDB() {
    await mongoose.connect(process.env.DB_URL);
    console.log('Connected to MongoDB');
}
const sslOptions = {
    key: fs.readFileSync('/home/ubuntu/ssl/mykey.key'), // Update the path if necessary
    cert: fs.readFileSync('/home/ubuntu/ssl/mycert.crt'), // Update the path if necessary
};

connectDB();
const corsOptions = {
    credentials: true,
    origin: ['http://localhost:3000', 'https://main.d19m4qsq21lz5t.amplifyapp.com'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));  // Handles preflight requests for all routes
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));

app.post('/register', async (req, res) => {
    const { username } = req.body;
    let { password } = req.body;
    password = bcrypt.hashSync(password, salt);
    try {
        const user = await User.create({ username, password });
        res.json(user);
    } catch (err) {
        return res.status(400).json({ message: 'Registration failed' });
    }
});
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (isPasswordValid === true) {
        jwt.sign({ username, id: user._id }, process.env.JWT_SECRET, (err, token) => {
            if (err) {
                return res.status(400).json({ message: 'Token generation failed' });
            }
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,           // Ensures cookies are sent over HTTPS
                sameSite: 'None',       // Required for cross-origin requests
                maxAge: 24 * 60 * 60 * 1000 // 1 day expiration
            }).json("ok");
            return;
        });
    } else {
        return res.status(400).json({ message: 'Invalid credentials' });
    }
});

app.get("/profile", async (req, res) => {
    const token = req.cookies.token;
    jwt.verify(token, secret, (err, decoded) => {
        if (err) {
            return res.status(400).json({ message: 'Invalid token' });
        }
        res.json(decoded);
    });
});

app.post("/logout", (req, res) => {
    res.clearCookie('token').json("ok");
});

app.post("/post", uploadMiddleware.single('file'), async (req, res) => {
    const token = req.cookies.token;
    const { title, summary, content } = req.body;
    let newPath = null;

    if (req.file) {
        const { originalname } = req.file;
        const parts = originalname.split('.');
        const extension = parts[parts.length - 1];
        newPath = req.file.path + '.' + extension;
        fs.renameSync(req.file.path, newPath);
    }

    jwt.verify(token, secret, async (err, decoded) => {
        if (err) {
            return res.status(400).json({ message: 'Invalid token' });
        }
        try {
            const post = await Post.create({
                title,
                summary,
                content,
                cover: newPath ? newPath : undefined, // Use newPath if it exists
                author: decoded.id,
            });
            return res.json(post);
        } catch (createErr) {
            return res.status(500).json({ message: 'Error creating post' });
        }
    });
});


app.put("/post", uploadMiddleware.single('file'), async (req, res) => {
    const token = req.cookies.token;
    const { id, title, summary, content } = req.body;
    let newPath = null;

    if (req.file) {
        const { originalname } = req.file;
        const parts = originalname.split('.');
        const extension = parts[parts.length - 1];
        newPath = req.file.path + '.' + extension;
        fs.renameSync(req.file.path, newPath);
    }

    jwt.verify(token, secret, async (err, decoded) => {
        if (err) {
            return res.status(400).json({ message: 'Invalid token' });
        }

        const post = await Post.findById(id);
        const isAuthor = JSON.stringify(post.author) === JSON.stringify(decoded.id);
        if (!isAuthor) {
            return res.status(400).json('You are not the author of this post');
        }

        try {
            await post.updateOne({
                title,
                summary,
                content,
                cover: newPath ? newPath : post.cover, // Use newPath if it exists, otherwise keep existing cover
            });
            return res.json(post);
        } catch (updateErr) {
            return res.status(500).json({ message: 'Error updating post' });
        }
    });
});



app.get("/post", async (req, res) => {
    const posts = await Post.find().populate('author', ['username']).sort({ createdAt: -1 }).limit(20);
    res.json(posts);
});

app.get("/post/:id", async (req, res) => {
    const { id } = req.params;
    const post = await Post.findById(id).populate('author', ['username']);
    res.json(post);
});


const port = 4000; // You can keep this port or change it as needed
https.createServer(sslOptions, app).listen(port, () => {
    console.log(`HTTPS Server running on port ${port}`);
});

