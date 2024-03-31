const express = require("express");
const webpack = require("webpack");
const path = require('path');
const ejs = require('ejs');

console.clear();
console.log("Starting Server ...");

const app = express();
app.use("/", express.static("./public"))
app.set('view engine', 'ejs');


app.get("/",( req, res, next) => {
    res.render("index");
});



webpack({
    mode: "production",
    entry: './src/test/test.ts',
    module: {
        rules: [
        {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/,
        },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        path: path.resolve(__dirname, 'public'),
        filename: 'bundle.js',
    },
}, function(err, stats) {
    if (err || stats.hasErrors()) {
        console.error(err || stats.toString('errors-only'));
    } else {
        console.log(stats.toString());
    };

    app.listen(3000, e => {
        if(e) {
            console.error(e)
            return;
        };
        console.log("\nServer Running : http://localhost:3000");
    });

});




