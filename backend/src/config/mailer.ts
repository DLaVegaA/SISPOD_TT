import nodemailer from "nodemailer";
import hbs from "nodemailer-express-handlebars";
import path from "path";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const handlebarOptions = {
  viewEngine: {
    extname: ".hbs",
    layoutsDir: path.join(__dirname, "../emails/layouts"),
    partialsDir: path.join(__dirname, "../emails/partials"),
    defaultLayout: "main"
  },
  viewPath: path.join(__dirname, "../emails"),
  extName: ".hbs"
};

transporter.use("compile", hbs(handlebarOptions));

export default transporter;