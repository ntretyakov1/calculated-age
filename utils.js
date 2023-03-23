/**
 * Модуль утилитарных функций:
 *  - для обработки данных из amoCRM;
 *  - общего назначения;
 */

/**
 * Функция извлекает значение из id поля, массива полей custom_fields сущности amoCRM
 *
 * @param {*} customFields - массив полей сущности;
 * @param {*} fieldId - id поля из которого нужно получить значение;
 * @returns значение поля
 */
const getFieldValue = (customFields, fieldId) => {
	const field = customFields
		? customFields.find((item) => String(item.field_id || item.id) === String(fieldId))
		: undefined;
	const value = field ? field.values[0].value : undefined;
	return value;
};

/**
 * Функция заполнения поля в amoCRM
 * @param {*} field_id - id поля, которое планируется заполнить. Поле должно быть заранее создано в amoCRM, id копируется из amo;
 * @param {*} value - значение поля, тип данных должен быть идентичным с типом поля в amoCRM;
 * @param {*} enum_id - В случае, если поле списковое или мультисписковое, то для указания нужного значения указывается данный параметр, т.е. id - варианта списка;
 * @returns типовой объект с данными о поле, который необходимо передать в amoCRM.
 */
const makeField = (field_id, value, enum_id) => {
	if (!value && value !== 0) {
		return undefined;
	}
	return {
		field_id,
		values: [
			{
				value,
				enum_id,
			},
		],
	};
};

/**
 * Функция расчета возраста по году рождения
 * @param {*} birthDay - Дата рождения;
 * @returns возраст в формате числа или ноль если в параметре отрицательное число.
 */
const сalculateAge = (birthDay) => {
	const now = new Date();
	const [day, month, year] = birthDay.split(".");
	const birthDayDate = new Date(+year, +month - 1, +day + 1);
	const birthdayCurrentYear = new Date(
		now.getFullYear(),
		birthDayDate.getMonth(),
		birthDayDate.getDate()
	);
	let age = now.getFullYear() - birthDayDate.getFullYear();
	if (now < birthdayCurrentYear) {
		age = age - 1;
	}
	if (age < 0) {
		age = 0;
	}
	return age;
};

module.exports = {
	getFieldValue,
	makeField,
	сalculateAge,
};
