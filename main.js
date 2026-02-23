const { Client, GatewayIntentBits, SlashCommandBuilder, Routes, EmbedBuilder } = require('discord.js');
const { REST } = require('@discordjs/rest');

// Health Check用
const http = require('http');

// KoyebのHealth CheckとUptimeRobot用の簡易サーバー
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is alive!');
}).listen(8000);

// 1. Botのクライアント作成（Slash CommandのみなのでGuildsインテントのみでOK）
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// 2. コマンドの定義
const commands = [
    new SlashCommandBuilder()
        .setName('sdvx')
        .setDescription('単曲VOLFORCEを計算します')
        .addNumberOption(opt => 
            opt.setName('level').setDescription('譜面定数を入力').setRequired(true).setMinValue(1.0).setMaxValue(20.9))
        .addIntegerOption(opt => 
            opt.setName('score').setDescription('スコアを入力（0 ~ 10,000,000）').setRequired(true).setMinValue(0).setMaxValue(10000000))
        .addStringOption(opt => 
            opt.setName('gauge').setDescription('ゲージや、UC/PUCのランプを選択')
            .setRequired(true)
            .addChoices(
                { name: 'PUC', value: 'puc' },
                { name: 'UC', value: 'uc' },
                { name: 'MAXXIVE COMP.  (白)', value: 'max' },
                { name: 'EXCESSIVE COMP.  (ハード)', value: 'ex' },
                { name: 'EFFECTIVE COMP.', value: 'c' },
                { name: 'TRACK CRASH', value: 'f' }
            ))
];

// 3. 起動時処理（コマンド登録）
/*/
client.once('clientReady', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        // 全サーバー共通のグローバルコマンドとして登録
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Slash Commands registered successfully.');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
});
/*/

client.once('ready', async (c) => {
    console.log(`> ログイン成功: ${c.user.tag}`);
    
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        console.log('> コマンド登録を開始します...');
        // client.user.id が不安定な場合があるため、c.user.id を使用
        await rest.put(Routes.applicationCommands(c.user.id), { body: commands });
        console.log('> コマンド登録が完了しました');
    } catch (error) {
        console.error('[!] コマンド登録エラー: ', error);
    }
});

// 4. インタラクション受信時の処理
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'sdvx') {
        const lv = interaction.options.getNumber('level');
        const sc = interaction.options.getInteger('score');
        const gauge = interaction.options.getString('gauge');

        // --- VOLFORCE計算ロジック ---
        
        // グレード係数
        let gradeFactor = 0.80; // Default (D)
        if (sc >= 9900000) gradeFactor = 1.05;      // S
        else if (sc >= 9800000) gradeFactor = 1.02; // AAA+
        else if (sc >= 9700000) gradeFactor = 1.00; // AAA
        else if (sc >= 9500000) gradeFactor = 0.97; // AA+
        else if (sc >= 9300000) gradeFactor = 0.94; // AA
        else if (sc >= 9000000) gradeFactor = 0.91; // A+
        else if (sc >= 8700000) gradeFactor = 0.88; // A
        else if (sc >= 7500000) gradeFactor = 0.85; // B
        else if (sc >= 6500000) gradeFactor = 0.82; // C

        // ゲージ（メダル）
        let medalFactor = 0.5;// FAILED
        let gaugeName = "TRACK CRASH"; 

        if (gauge === 'puc') {medalFactor = 1.10; gaugeName = "PUC";}
        else if (gauge === 'uc') {medalFactor = 1.06; gaugeName = "UC";}
        else if (gauge === 'max') {medalFactor = 1.04; gaugeName = "MAXXIVE COMP.";}
        else if (gauge === 'ex') {medalFactor = 1.02; gaugeName = "EXCESSIVE COMP.";}
        else if (gauge === 'c') {medalFactor = 1.00; gaugeName = "EFFECTIVE COMP.";}

        // ③ 計算式: Level * (Score/10,000,000) * GradeFactor * MedalFactor * 2 (単曲VF)
        const vf = Math.floor( lv * (sc / 10000000) * gradeFactor * medalFactor * 20 ); 

        // 色設定
        //let embedColor = 0xa52a2a

        //*
        let embedColor = 0xa52a2a;
        if (200 <= vf & vf < 240) embedColor = 0x000080;
        else if (240 <= vf & vf < 280) embedColor = 0xfcc800;
        else if (280 <= vf & vf < 300) embedColor = 0x25b7c0;
        else if (300 <= vf & vf < 320) embedColor = 0xf73562;
        else if (320 <= vf & vf < 340) embedColor = 0xff69b4;
        else if (340 <= vf & vf < 360) embedColor = 0xd5ddef;
        else if (360 <= vf & vf < 380) embedColor = 0xffd700;
        else if (380 <= vf & vf < 400) embedColor = 0xff0000;
        else if (400 <= vf) embedColor = 0x800080;
        //*/

        // 結果の返信
        const embed = new EmbedBuilder()
            .setColor(embedColor)
            /*
            .addFields(
                { name: '譜面定数', value: `${lv.toFixed(1)}`},
                { name: 'スコア', value: sc.toLocaleString()},
                { name: 'ゲージ', value: gaugeName},
                { name: '≪ 単曲VF ≫', value: `**${vf.toFixed(0)}**` }
            );
            //*/

            //*
            .addFields(
                { name: '入力情報', value: "・譜面定数：" + lv.toFixed(1) + "\n・スコア：" + sc.toLocaleString() + "\n・ゲージ：" + gaugeName},
                { name: '≪ 単曲VF ≫', value: `**${vf.toFixed(0)}**` }
            );
            //*/

        await interaction.reply({ embeds: [embed] });
    }
});

// 5. ログイン（環境変数を使用）
client.login(process.env.DISCORD_TOKEN);
