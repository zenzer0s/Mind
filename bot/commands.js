module.exports = {
    greet: function(name) {
        return `Hello, ${name}!`;
    },
    farewell: function(name) {
        return `Goodbye, ${name}!`;
    },
    help: function() {
        return `Available commands: greet, farewell, help`;
    }
};