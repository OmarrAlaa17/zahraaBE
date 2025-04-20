const AppError = require("./appError");

module.exports = func => {
    return (req, res, next) => {
      func(req, res, next).catch (err => {
        if (err instanceof AppError)
          res.status(err.statusCode).json({ error: err.toString() });
        else
          res.status(400).json({ error: err.toString() });
      });
    }
}