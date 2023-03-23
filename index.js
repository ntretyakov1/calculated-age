/**
 * Основной модуль приложения - точка входа.
 */

const express = require("express");
const api = require("./api");
const logger = require("./logger");
const config = require("./config");
const { getFieldValue, makeField,сalculateAge } = require("./utils");
const { ID_FIELD_BIRTHDAY, ID_FIELD_AGE } = require("./const");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/hook", (req, res) => {
	const [contact] = req.body.contacts.add;

	const birthdayValue = getFieldValue(contact.custom_fields, ID_FIELD_BIRTHDAY);

	if (!birthdayValue) {
		return res.send("Отсутствует дата рождения");
	}

	const year = +birthdayValue.split(".")[2];

	const age = сalculateAge(year);

	const makeFieldAge = makeField(+ID_FIELD_AGE, age);

	const contactForUpdate = {
		id: +contact.id,
		custom_fields_values: [makeFieldAge],
	};

	api.updateContacts(contactForUpdate).then(() => res.send("OK"));
});

app.listen(config.PORT, () => logger.debug("Server started on ", config.PORT));
