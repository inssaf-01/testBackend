const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'inssafbela12@gmail.com',
        pass: 'bzggapbuzqentsoi'
    }
});

exports.sendResetCodeEmail = async (to, code) => {
    try {
        console.log("Sending email to:", to);

        const info = await transporter.sendMail({
            from: 'ton_vrai_gmail@gmail.com',
            to: to,
            subject: 'Code de vérification',
            html: `
                <h2>Réinitialisation du mot de passe</h2>
                <p>Votre code :</p>
                <h1>${code}</h1>
            `
        });

        console.log("EMAIL SUCCESS =>", info.response);

        return true;

    } catch (error) {
        console.log("FULL EMAIL ERROR =>");
        console.log(error);

        throw error;
    }
};