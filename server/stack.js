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
        this.collection.push(item);
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
