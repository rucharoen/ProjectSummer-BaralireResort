// utils/formatPrice.js

const FormatPrice = (value, currency = 'บาท') => {
    if (value === null || value === undefined || isNaN(value)) return '-';

    const number = parseFloat(value).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });

    return `${number} ${currency}`;
};

export default FormatPrice;
