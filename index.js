import Fastify from 'fastify';
import proxy from '@fastify/http-proxy';

const fastify = Fastify({ logger: true });

// خواندن مقصد از متغیرهای محیطی
const TARGET_DOMAIN = process.env.TARGET_DOMAIN;

if (!TARGET_DOMAIN) {
  console.error("خطا: متغیر TARGET_DOMAIN تنظیم نشده است.");
  process.exit(1);
}

// لیست سیاه هدرها برای پاک‌سازی
const STRIP_HEADERS = [
  "host",
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "forwarded",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-forwarded-port"
];

fastify.register(proxy, {
  upstream: TARGET_DOMAIN,
  replyOptions: {
    rewriteRequestHeaders: (request, headers) => {
      const newHeaders = { ...headers };
      
      // حذف هدرهای حساس و اضافی
      STRIP_HEADERS.forEach(h => delete newHeaders[h]);
      
      // مدیریت IP کاربر برای سرور مقصد
      const clientIp = request.headers['x-real-ip'] || request.headers['x-forwarded-for'] || request.ip;
      newHeaders['x-forwarded-for'] = clientIp;

      return newHeaders;
    },
    rewriteHeaders: (headers) => {
      // حذف هدرهایی که باعث اختلال در کلاینت می‌شوند
      const newHeaders = { ...headers };
      delete newHeaders['transfer-encoding'];
      return newHeaders;
    }
  }
});

const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
