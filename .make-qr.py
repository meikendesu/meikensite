import os
import random
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public', 'payment')
os.makedirs(OUT, exist_ok=True)

FONT_TITLE = 'C:/Windows/Fonts/msyh.ttc'
FONT_SUB = 'C:/Windows/Fonts/msyh.ttc'


def make_qr(path, title, accent):
    size = 512
    img = Image.new('RGB', (size, size), '#ffffff')
    d = ImageDraw.Draw(img)

    # 外边框
    d.rectangle([0, 0, size - 1, size - 1], outline='#d0d0d5', width=2)

    # 二维码占位区域
    qr = 240
    qx = (size - qr) // 2
    qy = 110
    d.rectangle([qx, qy, qx + qr, qy + qr], fill='#f5f5f7', outline='#e0e0e5')

    # 三个定位角
    corner = 52
    for cx, cy in [(qx + 10, qy + 10), (qx + qr - corner - 10, qy + 10), (qx + 10, qy + qr - corner - 10)]:
        d.rectangle([cx, cy, cx + corner, cy + corner], outline='#1d1d1f', width=8)
        d.rectangle([cx + 18, cy + 18, cx + corner - 18, cy + corner - 18], fill='#1d1d1f')

    # 随机模块
    random.seed(hash(title) & 0xFFFF)
    cell = 8
    for i in range(qx + 76, qx + qr - 14, cell):
        for j in range(qy + 76, qy + qr - 14, cell):
            if random.random() < 0.45:
                d.rectangle([i, j, i + cell - 2, j + cell - 2], fill=accent)

    # 文字
    try:
        ft = ImageFont.truetype(FONT_TITLE, 36)
        fs = ImageFont.truetype(FONT_SUB, 24)
    except Exception:
        ft = ImageFont.load_default()
        fs = ImageFont.load_default()

    tw = d.textbbox((0, 0), title, font=ft)[2]
    d.text(((size - tw) // 2, qy + qr + 28), title, font=ft, fill='#1d1d1f')

    sub = '请替换为真实二维码图片'
    sw = d.textbbox((0, 0), sub, font=fs)[2]
    d.text(((size - sw) // 2, qy + qr + 80), sub, font=fs, fill='#86868b')

    img.save(path, 'PNG')
    print('saved', path)


make_qr(os.path.join(OUT, 'wechat-qr.png'), '微信收款二维码', '#07c160')
make_qr(os.path.join(OUT, 'alipay-qr.png'), '支付宝收款二维码', '#1677ff')
make_qr(os.path.join(OUT, 'usdt-qr.png'), 'USDT 收款二维码', '#26a17b')
