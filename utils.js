function replaceType(type) {
    return type.replace(/\/\w+/, '');
}

function formatDate(date) {
    const hours = newDate.getHours().toString().padStart(2, '0');
    const minutes = newDate.getMinutes().toString().padStart(2, '0');
    const day = newDate.getDate().toString().padStart(2, '0');
    const mount = (newDate.getMonth() + 1).toString().padStart(2, '0');
    const year = newDate.getFullYear();
    return `${hours}:${minutes} ${day}.${mount}.${year}`;
}


function linkGenerator(str) {
    // return str.match(/(https?:\/\[^\s]+)/g, '<a href=$1>$1</a>');
    // return str.match(/(https?:\/\/)?[a-z0-9~_\-\.]+\.[a-z]{2,9}(\/|:|\?[!-~]*)?/g);
    return str.match(/https?:\/\/[^\s]+/gm);
}

module.exports = {
    replaceType,
    formatDate,
    linkGenerator,
}