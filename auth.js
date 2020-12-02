var setNonAuthorised = function (res) {
    res.set('WWW-Authenticate', 'Basic realm="API Creator"');
    return res.status(401).send();
}

var getHash = function (password) {
    return "test";
}

module.exports = function (req) {
    console.log(req);
};

console.log(module.exports);
module.exports.getHash = getHash;
console.log(module.exports);
