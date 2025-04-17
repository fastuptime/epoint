# Epoint API Node.js Modülü

Bu modül, Epoint.az elektronik ödeme platformu için Node.js desteği sağlar. API üzerinden ödeme işlemlerini, kart kaydı ve doğrulama işlemlerini kolaylıkla gerçekleştirebilirsiniz.

## Kurulum

```bash
npm install axios
```

## Başlangıç

Epoint.az hesabınızı oluşturup, merchant (satıcı) hesabınızı yapılandırdıktan sonra size verilen `private_key` ve `public_key` bilgilerini kullanmanız gerekmektedir.

```javascript
const Epoint = require('./epoint.js');

// Kimlik bilgilerinizi tanımlayın
const privateKey = 'your_private_key';
const publicKey = 'your_public_key';
```

## Kullanım Örnekleri

### 1. Kart Bilgisi İle Ödeme Oluşturma

```javascript
async function createPayment() {
    try {
        const response = await Epoint.typeCard(
            privateKey,
            publicKey,
            'order123',        // Siparişinize özel benzersiz ID
            100.50,            // Ödeme tutarı
            'Test payment',    // Açıklama
            'https://example.com/success',  // Başarılı ödeme yönlendirme URL'i
            'https://example.com/error'     // Başarısız ödeme yönlendirme URL'i
        );
        
        if (response.status === 'success') {
            // Kullanıcıyı ödeme sayfasına yönlendirin
            console.log(`Ödeme sayfası URL: ${response.redirect_url}`);
            // redirect to: response.redirect_url
        } else {
            console.error('Ödeme sayfası oluşturulamadı:', response.message);
        }
    } catch (error) {
        console.error('Ödeme hatası:', error);
    }
}
```

### 2. Ödeme Durumunu Sorgulama

```javascript
async function checkPaymentStatus(orderId) {
    try {
        // Order ID ile sorgulama
        const response = await Epoint.checkPayment(privateKey, publicKey, orderId);
        console.log(`Ödeme durumu: ${response.status}`);
        return response;
        
        // Alternatif olarak Epoint transaction ID ile de sorgulama yapabilirsiniz
        // const response = await Epoint.checkPayment(privateKey, publicKey, transactionId, true);
    } catch (error) {
        console.error('Durum sorgulama hatası:', error);
    }
}
```

### 3. Kart Kaydetme

```javascript
async function saveCard() {
    try {
        const response = await Epoint.saveCardForPayment(
            privateKey,
            publicKey,
            'Kart kaydetme işlemi',
            'https://example.com/success',
            'https://example.com/error'
        );
        
        if (response.status === 'success') {
            console.log(`Kart kayıt sayfası: ${response.redirect_url}`);
            // redirect to: response.redirect_url
        } else {
            console.error('Kart kayıt sayfası oluşturulamadı:', response.message);
        }
    } catch (error) {
        console.error('Kart kaydetme hatası:', error);
    }
}
```

### 4. Kaydedilmiş Kart İle Ödeme Yapma

```javascript
async function payWithSavedCard(cardUid, orderId, amount) {
    try {
        const response = await Epoint.payWithSaved(
            privateKey,
            publicKey,
            cardUid,    // Kaydedilmiş kartın ID'si
            orderId,    // Sipariş ID
            amount,     // Ödeme tutarı
            'Kaydedilmiş kart ile ödeme'
        );
        
        if (response.status === 'success') {
            console.log('Ödeme başarılı!');
            console.log('Transaction ID:', response.transaction);
        } else {
            console.error('Ödeme başarısız:', response.message);
        }
        
        return response;
    } catch (error) {
        console.error('Kaydedilmiş kart ile ödeme hatası:', error);
    }
}
```

### 5. İade İşlemi

```javascript
async function refundPayment(cardUid, orderId, amount) {
    try {
        const response = await Epoint.refund(
            privateKey,
            publicKey,
            cardUid,
            orderId,
            amount,
            'Ödeme iadesi'
        );
        
        if (response.status === 'success') {
            console.log('İade işlemi başarılı!');
        } else {
            console.error('İade başarısız:', response.message);
        }
        
        return response;
    } catch (error) {
        console.error('İade işlemi hatası:', error);
    }
}
```

### 6. İşlem İptali

```javascript
async function cancelTransaction(transactionId, amount = null) {
    try {
        // Eğer amount belirtilmezse, işlem tamamen iptal edilir
        // amount belirtilirse, kısmi iptal gerçekleşir
        const response = await Epoint.cancel(
            privateKey,
            publicKey,
            transactionId,
            amount
        );
        
        if (response.status === 'success') {
            console.log('İşlem başarıyla iptal edildi');
        } else {
            console.error('İptal işlemi başarısız:', response.message);
        }
        
        return response;
    } catch (error) {
        console.error('İptal işlemi hatası:', error);
    }
}
```

### 7. Webhook (Callback) Doğrulama

Epoint.az, ödeme sonuçlarını result_url adresinize POST metodu ile gönderir. Bu verilerin gerçekten Epoint'ten geldiğini doğrulamak için:

```javascript
// Express.js örneği
app.post('/payment/callback', (req, res) => {
    const data = req.body.data;
    const signature = req.body.signature;
    
    // İmzayı doğrulayın
    const isValid = Epoint.validateCallback(privateKey, data, signature);
    
    if (isValid) {
        // Veriyi işleyin
        const epoint = new Epoint({
            private_key: privateKey,
            data: data,
            signature: signature
        });
        
        const paymentData = epoint.getDataAsObject();
        console.log('Ödeme sonucu:', paymentData);
        
        // Örnek: Siparişi güncelleme
        if (paymentData.status === 'success') {
            // Siparişi başarılı olarak işaretle
        } else {
            // Siparişi başarısız olarak işaretle
        }
        
        res.status(200).send('OK');
    } else {
        console.error('Geçersiz webhook imzası');
        res.status(400).send('Invalid signature');
    }
});
```

## API Referansı

### Örnek Oluşturma

```javascript
// Direkt örnek oluşturma
const epoint = new Epoint({
    private_key: 'your_private_key',
    public_key: 'your_public_key',
    // Diğer parametreler...
});

// veya statik yardımcı metod ile
const epoint = Epoint.instantiate('your_private_key', 'your_public_key');
```

### Ana Metotlar

#### Ödeme İşlemleri

- `typeCard(privateKey, publicKey, orderId, amount, description, successRedirectUrl, errorRedirectUrl)` - Yeni ödeme oluşturur
- `payWithSaved(privateKey, publicKey, cardUid, orderId, amount, description)` - Kaydedilmiş kart ile ödeme yapar
- `cancel(privateKey, publicKey, epointTransaction, amount)` - İşlem iptali/iadesi
- `refund(privateKey, publicKey, cardUid, orderId, amount, description)` - İade işlemi

#### Kart İşlemleri

- `saveCardForPayment(privateKey, publicKey, description, successRedirectUrl, errorRedirectUrl)` - Ödeme için kart kaydeder
- `saveCardForRefund(privateKey, publicKey, description, successRedirectUrl, errorRedirectUrl)` - İade için kart kaydeder

#### Sorgulama & Doğrulama

- `checkPayment(privateKey, publicKey, uid, epointTransaction)` - Ödeme durumunu kontrol eder
- `validateCallback(privateKey, data, signature)` - Webhook verilerini doğrular

### Nesne Metotları

Epoint nesnesi üzerinde de aşağıdaki metotları kullanabilirsiniz:

- `generatePaymentUrlWithTypingCard()` - Ödeme sayfası URL'i oluşturur
- `getStatus()` - İşlem durumunu sorgular
- `registerCardForPayment()` - Kart kaydeder
- `registerCardForRefund()` - İade için kart kaydeder
- `payWithSavedCard()` - Kaydedilmiş kart ile ödeme yapar
- `cancelPayment()` - İşlemi iptal eder
- `refundPayment()` - Ödemeyi iade eder
- `isSignatureValid()` - İmzayı doğrular
- `getDataAsJson()` - Data'yı JSON string olarak alır
- `getDataAsObject()` - Data'yı JavaScript nesnesi olarak alır

## Banka Cevap Kodları

| Kod | Açıklama |
|-----|----------|
| 0 | Onaylandı |
| 100 | Ret, genel, açıklama yok |
| 101 | Ret, kart süresi dolmuş |
| 102 | Ret, şüpheli dolandırıcılık |
| 103 | Ret, kart kabul eden alıcıyla iletişime geçin |
| 107, 108 | Ret, kart düzenleyicisine başvurun |
| 110 | Ret, geçersiz tutar |
| 111 | Ret, geçersiz kart numarası |
| 116 | Ret, yetersiz bakiye |
| 118 | Ret, kart kaydı yok |
| 119 | Ret, işleme kart sahibi için izin verilmedi |
| 120 | Ret, işleme terminal için izin verilmedi |
| 122 | Ret, güvenlik ihlali |
| 125 | Ret, kart etkin değil |
| 129 | Ret, şüpheli sahte kart |
| 400 | Kabul edildi (iptal için) |
| 500 | Durum mesajı, uzlaştırıldı, dengede |
| 501 | Durum mesajı, uzlaştırıldı, dengede değil |
| 907 | Ret, kart veren veya anahtar çalışmıyor |
| 908 | Ret, yönlendirme için işlem hedefi bulunamadı |
| 909 | Ret, sistem arızası |
| 911 | Ret, kart düzenleyicisi zaman aşımına uğradı |
| 912 | Ret, kart düzenleyicisi kullanılamıyor |
| 914 | Ret, orijinal işlem bulunamadı |

## Lisans

MIT
