
function add(a, b) {
    let c = 10;
    let d = 15;
    return a + b * c;
}

function getMeAlist(length) {

    let list = [];

    for (let i = 0; i < length; i++) {
        list.push(i);
    }
    return list;

}

const flep = 23490
const plep = getMeAlist(10).map((item) => item * 10);
let wp = plep.map((item) => item * 10);

console.log(getMeAlist(10).map((item) => item * 10));



console.log(add(1, 2));