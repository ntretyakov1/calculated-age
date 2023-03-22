/**
 * Модуль для работы c API amoCRM
 * Модуль используется для работы в NodeJS.
 */

const axios = require("axios");
const fs = require("fs");
const axiosRetry = require("axios-retry");
const config = require("./config");
const logger = require("./logger");

axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

const AMO_TOKEN_PATH = "amo_token.json";

function Api() {
	let access_token = null;
	let refresh_token = null;
	const ROOT_PATH = `https://${config.SUB_DOMAIN}.amocrm.ru`;

	const authChecker = (request) => {
		return (...args) => {
			if (!access_token) {
				return this.getAccessToken().then(() => authChecker(request)(...args));
			}
			return request(...args).catch((err) => {
				logger.error(err.response);
				logger.error(err);
				logger.error(err.response.data);
				const data = err.response.data;
				if ("validation-errors" in data) {
					data["validation-errors"].forEach(({ errors }) =>
						logger.error(errors)
					);
					logger.error("args", JSON.stringify(args, null, 2));
				}
				if (data.status == 401 && data.title === "Unauthorized") {
					logger.debug("Нужно обновить токен");
					return refreshToken().then(() => authChecker(request)(...args));
				}
				throw err;
			});
		};
	};

	const requestAccessToken = () => {
		return axios
			.post(`${ROOT_PATH}/oauth2/access_token`, {
				client_id: config.CLIENT_ID,
				client_secret: config.CLIENT_SECRET,
				grant_type: "authorization_code",
				code: config.AUTH_CODE,
				redirect_uri: config.REDIRECT_URI,
			})
			.then((res) => {
				logger.debug("Свежий токен получен");
				return res.data;
			})
			.catch((err) => {
				logger.error(err.response.data);
				throw err;
			});
	};

	const getAccessToken = async () => {
		if (access_token) {
			return Promise.resolve(access_token);
		}
		try {
			const content = fs.readFileSync(AMO_TOKEN_PATH);
			const token = JSON.parse(content);
			access_token = token.access_token;
			refresh_token = token.refresh_token;
			return Promise.resolve(token);
		} catch (error) {
			logger.error(`Ошибка при чтении файла ${AMO_TOKEN_PATH}`, error);
			logger.debug("Попытка заново получить токен");
			const token = await requestAccessToken();
			fs.writeFileSync(AMO_TOKEN_PATH, JSON.stringify(token));
			access_token = token.access_token;
			refresh_token = token.refresh_token;
			return Promise.resolve(token);
		}
	};

	const refreshToken = () => {
		return axios
			.post(`${ROOT_PATH}/oauth2/access_token`, {
				client_id: config.CLIENT_ID,
				client_secret: config.CLIENT_SECRET,
				grant_type: "refresh_token",
				refresh_token: refresh_token,
				redirect_uri: config.REDIRECT_URI,
			})
			.then((res) => {
				logger.debug("Токен успешно обновлен");
				const token = res.data;
				fs.writeFileSync(AMO_TOKEN_PATH, JSON.stringify(token));
				access_token = token.access_token;
				refresh_token = token.refresh_token;
				return token;
			})
			.catch((err) => {
				logger.error("Не удалось обновить токен");
				logger.error(err.response.data);
			});
	};

	this.getAccessToken = getAccessToken;

	// Обновить контакты
	this.updateContacts = authChecker((data) => {
		return axios.patch(`${ROOT_PATH}/api/v4/contacts`, [].concat(data), {
			headers: {
				Authorization: `Bearer ${access_token}`,
			},
		});
	});
}

module.exports = new Api();
