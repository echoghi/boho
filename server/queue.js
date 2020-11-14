// First in, first out (FIFO principle)
module.exports = function Queue() {
    this.collection = [];

    this.print = () => {
        console.log('\n');
        console.log(`Queue (${this.collection.length}): [`);
        for (let i = this.collection.length; i--; ) {
            console.log({
                socketId: this.collection[i].id,
                userId: this.collection[i].user
            });
        }

        console.log(']\n');
    };

    this.find = (expression) => this.collection.find(expression);

    this.push = (item) => {
        const existingSocket = this.find((socket) => socket.id === item.id);

        if (!existingSocket) {
            this.collection.push(item);
        }
    };

    this.remove = (id) => {
        this.collection = this.collection.filter((socket) => socket.id !== id);
        if (this.isEmpty()) console.log('queue emptied');
    };

    this.next = () => {
        return this.collection.shift();
    };

    this.peek = () => {
        return this.collection[0];
    };

    this.isEmpty = () => {
        return !this.collection.length;
    };

    this.clear = () => {
        this.collection = [];
        console.log('queue emptied');
    };
};
