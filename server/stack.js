// Last in, first out (LIFO principle)
module.exports = function Stack() {
    this.collection = [];

    this.print = () => {
        console.log('\n');
        console.log(`Queue (${this.collection.length}): [`);
        for (let i = this.collection.length; i--; ) {
            console.log({
                sid: this.collection[i].socket.id,
                user: this.collection[i].user
            });
        }

        console.log(']\n');
    };

    this.find = (expression) => this.collection.find(expression);

    this.push = (item) => {
        const existingSocket = this.find((user) => user.socket.id === item.socket.id);

        if (!existingSocket) {
            this.collection.push(item);
        }
    };

    this.remove = (id) => {
        this.collection = this.collection.filter((user) => user.socket.id !== id);
        if (this.isEmpty()) console.log('queue emptied');
    };

    this.next = () => {
        return this.collection.shift();
    };

    this.peek = () => {
        return this.collection[this.collection.length - 1];
    };

    this.isEmpty = () => {
        return !this.collection.length;
    };

    this.clear = () => {
        this.collection = [];
        console.log('queue emptied');
    };
};
