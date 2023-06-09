
function add(a, b) {
    let c = 10;
    return a + b * c;
}

function getMeAlist(length) {
    let list = [];
    for (let i = 0; i < length; i++) {
        list.push(i);
    }
    return list;

}

console.log(getMeAlist(10).map((item) => item * 10));



console.log(add(1, 2));