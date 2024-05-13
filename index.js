const express = require("express");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const axios = require("axios");
const zlib = require("zlib");
const app = express();

const URL = "https://food.grab.com/sg/en/restaurants";

async function fetchData() {
    try {
        const response = await axios.get(URL, {
            headers: {
                'Upgrade-Insecure-Requests': '1',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
            }
        });

        const dom = new JSDOM(response.data);
        const document = dom.window.document;

        let product = [];

        document.querySelectorAll(".ant-col-24.colInfo___3iLqj.ant-col-md-24.ant-col-lg-24").forEach(element => {
            product.push({
                name: element.querySelector(".name___2epcT").textContent,
                Dish: element.querySelector(".basicInfoRow___UZM8d.cuisine___T2tCh").textContent,
                riting: element.querySelector(".numbers___2xZGn .numbersChild___2qKMV").textContent,
                time: element.querySelector(".numbersChild___2qKMV").textContent,
                km: element.querySelector(".numbersChild___2qKMV").textContent,
            });
        });

        return product;

    } catch (error) {
        console.log(error);
        throw error;
    }
}

app.get("/", async (req, res) => {
    try {
        const data = await fetchData();
        const ndjsonData = data.map(item => JSON.stringify(item)).join('\n');

        // Compress with gzip
        zlib.gzip(ndjsonData, (err, buffer) => {
            if (err) {
                console.error('Error compressing data:', err);
                res.status(500).send('Internal Server Error');
                return;
            }

            // Send gzipped ndjson content
            res.set('Content-Type', 'application/json');
            res.set('Content-Encoding', 'gzip');
            res.status(200).send(buffer);
        });

    } catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).send('Internal Server Error');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
