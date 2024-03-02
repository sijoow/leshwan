const express = require('express');
const app = express();
const PORT = 8007;

// MongoDB 연결
const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://yogibo:yogibo@cluster0.vvkyawf.mongodb.net/todoapp?retryWrites=true&w=majority';

let db;
MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
        db = client.db('todoapp');
        console.log('MongoDB에 연결되었습니다.');
    })
    .catch(err => console.error('MongoDB 연결 오류:', err));

// CORS 허용
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// JSON 파싱 미들웨어 추가
app.use(express.json());

// 출석체크 요청 처리
app.post('/attend', async (req, res) => {
    const { memberId } = req.body;
    const currentDate = new Date().toISOString().slice(0, 10); 
    
    // 출석체크 데이터를 저장할 collection 선택
    const collection = db.collection('attendance');

    try {
        // 해당 memberId와 currentDate로 이미 출석체크가 되었는지 확인
        const existingAttendance = await collection.findOne({ memberId, date: currentDate });
        if (existingAttendance) {
            console.log('이미 출석한 사용자입니다.');
            return res.status(400).json({ message: '이미 출석한 사용자입니다.' });
        }

        // 출석체크 데이터 삽입
        await collection.insertOne({ memberId, date: currentDate });
        console.log('출석체크가 완료되었습니다.');
        res.json({ message: '출석체크가 완료되었습니다.', consecutiveAttendance: 1 }); // 일단 출석 횟수 1로 응답
    } catch (err) {
        console.error('출석체크 저장 실패:', err);
        res.status(500).json({ error: '출석체크 저장에 실패했습니다.' });
    }
});

// 출석체크 초기화 요청 처리
app.post('/resetAttendance', async (req, res) => {
    // 출석체크 데이터 초기화
    const collection = db.collection('attendance');
    try {
        await collection.deleteMany({});
        console.log('출석체크가 초기화되었습니다.');
        res.json({ message: '출석체크가 초기화되었습니다.' });
    } catch (err) {
        console.error('출석체크 초기화 실패:', err);
        res.status(500).json({ error: '출석체크 초기화에 실패했습니다.' });
    }
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
