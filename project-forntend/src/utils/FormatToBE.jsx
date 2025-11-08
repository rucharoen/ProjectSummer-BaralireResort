// utils/formatToBE.js
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

const formatToBE = (date, noday = false, time = false) => {
    if (!date) return '';
    const dateObj = new Date(date);

    const christianYear = format(dateObj, 'yyyy');
    const buddhistYear = parseInt(christianYear) + 543;

    let pattern = '';

    if (noday) {
        pattern = 'EEE d MMM';
    } else {
        pattern = 'd MMM';
    }

    const datePart = format(dateObj, pattern, { locale: th });

    if (time) {
        const timePart = format(dateObj, 'HH:mm');
        return `${datePart} ${buddhistYear} ${timePart}`;  // อา. 13 เม.ย. 2568 16:30
    }

    return `${datePart} ${buddhistYear}`;  // อา. 13 เม.ย. 2568
};

export default formatToBE;
