/**
 * Основной модуль приложения - точка входа.
 */

const express = require("express");
const api = require("./api");
const logger = require("./logger");
const config = require("./config");
const { getFieldValue, makeField } = require("./utils");

const app = express();

const ID_FIELD_BIRTHDAY = "375847";
const ID_FIELD_AGE = "377623";

const сalculateAge = (year) => {
	const age = new Date().getFullYear() - year;
	if (Math.sign(age) === -1) {
		return 0;
	}
	return age;
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/hook", (req, res) => {
	const contact = req.body.contacts.add[0];

	const birthdayValue = getFieldValue(contact.custom_fields, ID_FIELD_BIRTHDAY);

	if (!birthdayValue) {
		res.send("Отсутствует дата рождения");
		return;
	}

	const year = +birthdayValue.split(".")[2];

	const age = сalculateAge(year);

	const makeFieldAge = makeField(+ID_FIELD_AGE, age);

	const contactForUpdate = {
		id: +contact.id,
		custom_fields_values: [makeFieldAge],
	};

	api.updateContacts(contactForUpdate).then(() => {
		res.send("OK");
	});
});

app.listen(config.PORT, () => logger.debug("Server started on ", config.PORT));
