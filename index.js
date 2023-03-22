/**
 * Основной модуль приложения - точка входа.
 */

const express = require("express");
const api = require("./api");
const logger = require("./logger");
const config = require("./config");
const { getFieldValue, makeField } = require("./utils");

const app = express();

const idFieldBirthDay = "375847";
const idFieldAge = "377623";

const сalculateAge = (year) => {
	return new Date().getFullYear() - year;
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

api.getAccessToken().then(() => {
	app.post("/hook", (req, res) => {
		const contact = req.body.contacts.add[0];

		const birthdayValue = getFieldValue(contact.custom_fields, idFieldBirthDay);

		if (!birthdayValue) {
			res.send("Отсутствует дата рождения");
			return;
		}

		const year = +birthdayValue.split(".")[2];

		const age = сalculateAge(year);

		const makeFieldAge = makeField(+idFieldAge, age);

		const obj = {
			id: +contact.id,
			custom_fields_values: [makeFieldAge],
		};

		api.updateContacts(obj).then(() => {
			res.send("OK");
		});
	});
	app.listen(config.PORT, () =>
		logger.debug("Server started on ", config.PORT)
	);
});
