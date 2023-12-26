const express = require('express');
const bodyParser = require('body-parser');
const os = require('os');
const app = express();
const port = 3000;

// 허용된 IP 주소 목록 정의
let allowedIPs = ['192.168.1.100', '10.0.0.2', '172.17.144.1', '::ffff:172.17.0.1'];

// JSON 요청 파싱을 위한 미들웨어 사용
app.use(bodyParser.json());

// 클라이언트 IP가 허용 목록에 있는지 확인하는 미들웨어
const checkIPMiddleware = (req, res, next) => {
  const clientIP = getClientIP(req);

  if (allowedIPs.includes(clientIP)) {
    // IP가 허용되었으면 다음 미들웨어 또는 라우트 핸들러로 진행
    next();
  } else {
    // IP가 허용되지 않았으면 클라이언트의 IP 주소를 응답으로 보냄
    res.status(403).send(`접근이 금지되었습니다. 클라이언트 IP: ${clientIP}`);
  }
};

// IP를 허용 목록에 추가하는 미들웨어
const addIPMiddleware = (req, res, next) => {
  const { newIP } = req.body;

  if (newIP) {
    allowedIPs.push(newIP);
    res.json({ message: `IP ${newIP}가 허용 목록에 추가되었습니다` });
  } else {
    res.status(400).json({ error: '요청 본문에 newIP가 누락되었습니다' });
  }
};

// 현재 허용된 IP 주소 목록을 가져오는 API 엔드포인트
app.get('/api/getAllowedIPs', (req, res) => {
    res.json({ allowedIPs });
  });

// 현재 등록된 API 목록을 가져오는 API 엔드포인트
app.get('/api/getAPIList', (req, res) => {
    const apiList = app._router.stack
      .filter((r) => r.route)
      .map((r) => ({
        path: r.route.path,
        methods: Object.keys(r.route.methods).filter((method) => method !== '_all'),
      }));
  
    res.json({ apiList });
  });

  
// 모든 라우트에 미들웨어 사용
app.use(checkIPMiddleware);

// 예제 라우트
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello, World!' });
});

app.get('/api/os', (req, res) => {
  const osInfo = {
    platform: os.platform(),
    type: os.type(),
    arch: os.arch(),
    release: os.release(),
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
  };
  res.json({ osInfo });
});

// IP를 허용 목록에 추가하는 API 엔드포인트
app.post('/api/addIP', addIPMiddleware);

app.listen(port, () => {
  console.log(`서버가 http://localhost:${port}에서 실행 중입니다`);
});

// 클라이언트의 IP 주소 가져오기
const getClientIP = (req) => {
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    // 프록시를 통해 전달된 경우, 클라이언트 IP가 목록에 있을 수 있음
    const ips = xForwardedFor.split(',');
    return ips[0].trim();
  } else {
    // 서버에 직접 연결된 경우
    return req.connection.remoteAddress;
  }
};
