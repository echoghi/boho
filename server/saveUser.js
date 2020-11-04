const faunadb = require('faunadb');

export default async function saveUserInfo(user) {
    const q = faunadb.query;
    const client = new faunadb.Client({
        secret: process.env.FAUNA_SECRET_KEY
    });

    // Check and see if the doc exists.
    const doesUserExist = await client.query(q.Exists(q.Match(q.Index('user_by_id'), user)));

    if (!doesUserExist) {
        console.log(`new user being created`);

        await client.query(
            q.Create(q.Collection('users'), {
                data: { user }
            })
        );
    }
    // Fetch the document for-real
    // const document = await client.query(q.Get(q.Match(q.Index('user_by_id'), user)));
    // await client.query(
    //     q.Update(document.ref, {
    //         data: {
    //             visits: document.data.visits + 1
    //         }
    //     })
    // );
}
