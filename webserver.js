const express = require('express');
const app = express();
const pgp = require("pg-promise")();
const bodyParser = require("body-parser");
const multer = require('multer');
const cors = require('cors')
const db = pgp('postgres://postgres:Athichaboat2911*@192.168.1.9:5432/accountant');

app.use(express.static(__dirname + "/"))
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json())
app.use(cors());
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads")
    },
    filename: (req, file, cb) => {
        cb(null, new Date().getTime() + ".jpg");
    }
})
var upload = multer({ storage: storage}).single("myfile");

app.listen(3000, () => {
    console.log("server is running...")
})

app.get("/helloworld", (req, res) => {
    db.any("select * from ac_test")
    .then((data1) => {
        console.log(data1);
        return res.status(200).json(data1);
    })
    .catch((error1) => {
        console.log(error1);
        return res.status(400)
    })
})

app.post("/api/savestatement", (req, res) => {
    try {
        var type = req.body.type;
        var amount = req.body.amount;
        var img = req.body.img;
        var remark = req.body.remark;

        if(type && amount && img && remark) {
            var txn = "BL" + new Date().getTime();
            var doingtime = new Date() + "";
            var mil = new Date().getTime();
            amount = parseFloat(amount);
            db.any("insert into ac_transaction (txn, type, amount, img, doingtime, mil, remark) values ($1,$4,$5,$6,$7,$8,$9) returning * ",
            [txn, "", "", type, amount, img, doingtime, mil, remark])
            .then((data1) => {
                return res.status(200).json({
                    code: 200,
                    message: "success"
                })
            })
            .catch(() => {
                return res.status(500).json({
                    code: 500,
                    message: "error"
                })
            })
        }
        else {
            return res.status(400).json({
                code: 400,
                message: "error"
            })
        }
    }
    catch(error) {
        return res.status(500).json({
            code: 500,
            message: "error"
        })
    }
})

app.post("/api/upload", (req, res) => {
    try {
        console.log("call me si")
        upload(req, res, (error) => {
            if(error) {
                return res.status(500).json({
                    code: 500,
                    message: "error"
                })
            }
            else {
                var filename = req.file.filename;
                console.log("filename", filename)
                return res.status(200).json({
                    code: 200,
                    message: "success",
                    result: {
                        purename: filename,
                        fullpath: "http://localhost:3000/uploads/" + filename
                    }
                })
            }
        })
    }
    catch(error) {
        return res.status(500).json({
            code: 500,
            message: "error"
        })
    }
})

app.post("/api/getstatement", (req, res) => {
    try {
        // var remark = req.body.remark;

        if(true) {
            var d = new Date();
            var month = String(d).substr(4,3);
            var year = d.getFullYear();
            db.any("select UPPER(type) as type, remark as title, amount, doingtime, mil, img as slip from ac_transaction where doingtime like $1 and doingtime like $2 order by mil desc",
            ["%"+month+"%", "%"+year+"%"])
            .then((data1) => {
                if(data1 && data1[0]) {
                    db.any("select sum(amount) as paymentamount from ac_transaction where type = 'payment' and doingtime like $1 and doingtime like $2 ",
                    ["%"+month+"%", "%"+year+"%"])
                    .then((data2) => {
                        console.log(data2)
                        var balance = 0;
                        for (let i = 0; i < data1.length; i++) {
                            const element = data1[i];
                            if(element.type == "PAYMENT") {
                                balance -= parseFloat(element.amount)
                            }
                            else { // TOPUP
                                balance += parseFloat(element.amount)
                            }
                        }
                        return res.status(200).json({
                            code: 200,
                            message: "success",
                            result: data1,
                            balance: balance,
                            payment: data2 && data2[0].paymentamount ? data2[0].paymentamount : 0
                        })
                    })
                    .catch((error) => {
                        console.log(error)
                        return res.status(500).json({
                            code: 500,
                            message: "error"
                        })
                    })
                }
                else {
                    return res.status(200).json({
                        code: 200,
                        message: "success",
                        result: []
                    })
                }
            })
            .catch(() => {
                return res.status(500).json({
                    code: 500,
                    message: "error"
                })
            })
        }
        else {
            return res.status(400).json({
                code: 400,
                message: "error"
            })
        }
    }
    catch(error) {
        return res.status(500).json({
            code: 500,
            message: "error"
        })
    }
})