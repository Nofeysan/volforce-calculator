const { Client, GatewayIntentBits, SlashCommandBuilder, Routes, EmbedBuilder } = require('discord.js');
const { REST } = require('@discordjs/rest');

// 1. Botのクライアント作成（Slash CommandのみなのでGuildsインテントのみでOK）
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// 2. コマンドの定義
const commands = [
    new SlashCommandBuilder()
        .setName('sdvx')
        .setDescription('VOLFORCEを計算します')
        .addNumberOption(opt => 
            opt.setName('level').setDescription('譜面定数').setRequired(true).setMinValue(1.0).setMaxValue(20.9))
        .addIntegerOption(opt => 
            opt.setName('score').setDescription('スコア').setRequired(true).setMinValue(0).setMaxValue(10000000))
        .addStringOption(opt => 
            opt.setName('gauge').setDescription('ゲージ')
            .setRequired(true)
            .addChoices(
                { name: 'PUC', value: 'puc' },
                { name: 'UC', value: 'uc' },
                { name: 'MAXXIVE', value: 'max' },
                { name: 'EXCESSIVE', value: 'ex' },
                { name: 'EFFECTIVE', value: 'c' },
                { name: 'FAILED', value: 'f' }
            ))
];

// 3. 起動時処理（コマンド登録）
client.once('ready', async () => {
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

// 4. インタラクション受信時の処理
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'sdvx') {
        const lv = interaction.options.getInteger('level');
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
        let medalFactor = 0.5; // FAILED
        if (gauge === 'puc') medalFactor = 1.10;
        else if (gauge === 'uc') medalFactor = 1.06;
        else if (gauge === 'max') medalFactor = 1.04;
        else if (gauge === 'ex') medalFactor = 1.02;
        else if (gauge === 'c') medalFactor = 1.00;

        // ③ 計算式: Level * (Score/10,000,000) * GradeFactor * MedalFactor * 2 (単曲VF)
        const vf = Math.floor( lv * (sc / 10000000) * gradeFactor * medalFactor * 20 ); 

        // 結果の返信
        const embed = new EmbedBuilder()
            .setTitle('SDVX VOLFORCE Calculator')
            .setColor(0xff00ff)
            .addFields(
                { name: '譜面レベル', value: `Lv ${lv}`, inline: true },
                { name: 'スコア', value: sc.toLocaleString(), inline: true },
                { name: 'ゲージ', value: gauge.toUpperCase(), inline: true },
                { name: '計算結果 (単曲VF)', value: `**${vf.toFixed(3)}**` }
            );

        await interaction.reply({ embeds: [embed] });
    }
});

// 5. ログイン（環境変数を使用）
client.login(process.env.DISCORD_TOKEN);
