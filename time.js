import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';
import chalk from 'chalk';

const token = '7295772550:AAF84PMWK2TQ8xQFZ5EAjC_D4APChk7RUEs'; // Token del bot de Telegram
const bot = new TelegramBot(token, { polling: true });

const buyUrl = "https://telegram.hypurr.fun/hypurr.Telegram/HyperliquidLaunchTrade";
const headers = {
  "accept": "application/grpc-web-text",
  "content-type": "application/grpc-web-text",
  "x-grpc-web": "1"
};

let stopPurchase = false; // Bandera para controlar la detención

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "¡Bienvenido! Envía /buy para iniciar la compra.");
});

bot.onText(/\/buy/, (msg) => {
  stopPurchase = false; // Aseguramos que el ciclo no se detenga antes de que inicie
  bot.sendMessage(msg.chat.id, "Por favor, envía el payload para la compra.");
  
  bot.once('message', async (payloadMsg) => {
    const buyBody = payloadMsg.text;
    
    if (!buyBody || buyBody.trim() === "") {
      bot.sendMessage(msg.chat.id, "El payload no puede estar vacío. Inténtalo de nuevo.");
      return;
    }

    let attemptCount = 0; // Contador de intentos fallidos
    let successfulPurchase = false; // Bandera para saber si la compra fue exitosa

    while (!successfulPurchase && attemptCount < 5 && !stopPurchase) {
      try {
        const response = await fetch(buyUrl, { method: 'POST', headers, body: buyBody });
        const base64Response = await response.text();
        const decodedResponse = decodeAndCleanResponse(base64Response);

        if (decodedResponse.includes("Bought")) {
          bot.sendMessage(msg.chat.id, `¡Compra exitosa!\nRespuesta: ${decodedResponse}`);
          successfulPurchase = true; // Compra exitosa
        } else {
          bot.sendMessage(msg.chat.id, `Resultado: ${decodedResponse}`);
          attemptCount++;
          
          if (attemptCount >= 5) {
            bot.sendMessage(msg.chat.id, "Has alcanzado el número máximo de intentos fallidos. Esperando 1.2 segundos antes de intentar de nuevo...");
            await delay(1200); // Espera de 1.2 segundos
            attemptCount = 0; // Reseteamos el contador de intentos fallidos
          }
        }
      } catch (error) {
        bot.sendMessage(msg.chat.id, `Error durante la compra: ${error.message}`);
        break; // Si ocurre un error, salimos del ciclo
      }
    }

    if (!successfulPurchase) {
      bot.sendMessage(msg.chat.id, "No se pudo realizar la compra después de varios intentos.");
    }
  });
});

bot.onText(/\/detener/, (msg) => {
  stopPurchase = true; // Establece la bandera para detener el ciclo
  bot.sendMessage(msg.chat.id, "La compra ha sido detenida.");
});

function decodeAndCleanResponse(base64String) {
  try {
    return Buffer.from(base64String, 'base64')
      .toString('utf-8')
      .replace(/[\x00-\x1F\x7F-\x9F]|[^\x20-\x7E]/g, '')
      .trim();
  } catch {
    return "";
  }
}

// Función para introducir un retraso
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

bot.on('polling_error', (error) => {
  console.error('Error de polling:', error.message);
});
