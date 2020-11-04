// Last in, first out (LIFO principle)
module.exports = function Stack() {
    this.collection = [];

    this.print = () => {
        console.log('\n');
        console.log(`Queue (${this.collection.length}): [`);
        for (let i = this.collection.length; i--; ) {
            console.log({
                sid: this.collection[i].id,
                ip: this.collection[i].handshake.address
            });
        }

        console.log(']\n');
    };

    this.find = (expression) => this.collection.find(expression);

    this.push = (item) => {
        const existingSocket = this.collection.find((existingSocket) => existingSocket.id === item.id);

        if (!existingSocket) {
            this.collection.push(item);
        }
    };

    this.remove = (id) => {
        this.collection = this.collection.filter((socket) => socket.id !== id);
    };

    this.next = () => {
        return this.collection.shift();
    };

    this.isEmpty = () => {
        return !this.collection.length;
    };

    this.clear = () => {
        this.collection = [];
    };
};
