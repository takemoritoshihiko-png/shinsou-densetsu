// ゲームエントリポイント
(function () {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  // 音響システム初期化
  SoundSystem.init();

  canvas.width = CONFIG.CANVAS_WIDTH;
  canvas.height = CONFIG.CANVAS_HEIGHT;

  // レスポンシブスケーリング
  let currentScale = 1;

  function resize() {
    const scaleX = window.innerWidth / CONFIG.CANVAS_WIDTH;
    const scaleY = window.innerHeight / CONFIG.CANVAS_HEIGHT;
    currentScale = Math.min(scaleX, scaleY);

    const container = document.getElementById('game-container');
    container.style.width = CONFIG.CANVAS_WIDTH * currentScale + 'px';
    container.style.height = CONFIG.CANVAS_HEIGHT * currentScale + 'px';
    canvas.style.width = CONFIG.CANVAS_WIDTH * currentScale + 'px';
    canvas.style.height = CONFIG.CANVAS_HEIGHT * currentScale + 'px';
  }

  window.addEventListener('resize', resize);
  resize();

  // 入力管理
  const inputManager = new InputManager(canvas, function () { return currentScale; });

  // コアシステム初期化
  const bookSystem = new BookSystem();
  const equipSystem = new EquipmentSystem();
  const partySystem = new PartySystem();

  // プレイヤー（空のまま — newGame or loadで初期化）
  const player = new Player(inputManager, partySystem, equipSystem);

  // ゲーム状態オブジェクト（セーブ/ロード用の参照まとめ）
  var gameState = {
    player: player,
    partySystem: partySystem,
    equipSystem: equipSystem,
    bookSystem: bookSystem,
    stageSelectScene: null, // 後でセット
    settings: { bgmVolume: 0.7, seVolume: 0.8 },
  };

  // 新規ゲーム初期化
  function initNewGame() {
    // パーティリセット
    partySystem.characters = [];
    partySystem.frontLine = [null, null, null];
    partySystem.reserve = [null, null, null];
    partySystem._nextId = 1;
    partySystem.enhanceMaterials = 0;

    // 初期キャラ
    var leaderChar = partySystem.addCharacter('プレイヤー', 'warrior', 'SR');
    partySystem.frontLine[0] = leaderChar.id;

    // テスト用仲間
    partySystem.addCharacter('リーナ', 'priest', 'R');
    partySystem.addCharacter('カゲ', 'archer', 'SR');
    partySystem.addCharacter('ゴルド', 'shielder', 'N');

    // 装備リセット
    equipSystem.inventory = [];
    equipSystem._nextUid = 1;
    equipSystem.equipped = { weapon: null, shield: null, head: null, body: null, feet: null, accessory: null };
    equipSystem.cores = { common: 10, uncommon: 5, rare: 3, epic: 0, legend: 0 };
    equipSystem.rerollStones = 5;
    equipSystem.eraseStones = 2;
    equipSystem.hpPotions = 3;
    equipSystem.mpPotions = 2;
    equipSystem.presets = [];

    var starterSword = equipSystem.addEquipment('w01', 'common');
    equipSystem.equip(starterSword.uid);
    equipSystem.addEquipment('w02', 'common');
    equipSystem.addEquipment('w02', 'uncommon');
    equipSystem.addEquipment('w03', 'rare');

    // プレイヤーリセット
    player.name = leaderChar.name;
    player.level = 1;
    player.totalExp = 0;
    player.expToNext = LevelSystem.expToNext(1);
    player.ownedGold = 0;
    player.job = leaderChar.job;
    player.rarity = leaderChar.rarity;
    player.classLevels = {};
    for (var i = 0; i < ClassData.JOB_KEYS.length; i++) {
      player.classLevels[ClassData.JOB_KEYS[i]] = 1;
    }
    player._applyStats();
    player.hp = player.hpMax;
    player.mp = player.mpMax;

    // 図鑑リセット
    bookSystem.monsters = {};
    bookSystem.equipment = {};
    bookSystem.items = {};
    for (var ei = 0; ei < equipSystem.inventory.length; ei++) {
      var eq = equipSystem.inventory[ei];
      bookSystem.registerEquipment(eq.baseId, eq.rank, eq.upgradeLevel || 0);
    }

    // ステージ進行リセット
    if (gameState.stageSelectScene) {
      gameState.stageSelectScene.progress = {};
      gameState.stageSelectScene._ensureUnlocked(1, 1);
      gameState.stageSelectScene.selectedWorld = 1;
    }

    console.log('新規ゲーム開始');
  }

  // セーブデータからロード
  function loadGame(slotIndex) {
    var data = SaveSystem.load(slotIndex !== undefined ? slotIndex : 0);
    if (!data) return false;
    SaveSystem.applyLoad(data, gameState);
    console.log('セーブデータをロードしました (Lv.' + player.level + ')');
    return true;
  }

  // セーブ実行（どこからでも呼べるグローバル関数）
  function saveGame(slotIndex) {
    SaveSystem.save(gameState, slotIndex !== undefined ? slotIndex : 0);
  }

  // グローバルに公開（各シーンから呼べるように）
  window._saveGame = saveGame;
window._gameState = gameState;

  // シーン管理の初期化
  const sceneManager = new SceneManager();

  sceneManager.register('title', new TitleScene(sceneManager,
    function () { initNewGame(); },       // はじめから
    function () { loadGame(); }           // つづきから
  ));
  sceneManager.register('home', new HomeScene(sceneManager, inputManager, player, partySystem));
  sceneManager.register('party', new PartyScene(sceneManager, player, partySystem));
  sceneManager.register('gacha', new GachaScene(sceneManager, player, partySystem));
  sceneManager.register('equip', new EquipScene(sceneManager, player, equipSystem));
  sceneManager.register('upgrade', new UpgradeScene(sceneManager, player, equipSystem));
  sceneManager.register('shop', new ShopScene(sceneManager, player, equipSystem, partySystem));
  sceneManager.register('bag', new BagScene(sceneManager, player, equipSystem, partySystem));
  sceneManager.register('stageSelect', new StageSelectScene(sceneManager, player));
  sceneManager.register('book', new BookScene(sceneManager, bookSystem));
  sceneManager.register('battle', new BattleScene(sceneManager, inputManager, player, partySystem, equipSystem, bookSystem));
  sceneManager.register('result', new ResultScene(sceneManager));
  sceneManager.register('settings', new SettingsScene(sceneManager, gameState));
sceneManager.register('saveload', new SaveLoadScene(sceneManager, gameState));

  // ステージセレクトへの参照をgameStateに保持
  gameState.stageSelectScene = sceneManager.scenes['stageSelect'];

  // 新規ゲームの初期データ投入（タイトルで選択前のデフォルト）
  initNewGame();

  sceneManager.changeSceneImmediate('title');

  // --- 自動セーブフックをSceneManagerに追加 ---
  var origChangeScene = sceneManager.changeScene.bind(sceneManager);
  sceneManager.changeScene = function (name) {
    // ホーム画面に戻る時に自動セーブ
    if (name === 'home') {
      saveGame();
    }
    origChangeScene(name);
  };

  // タップ座標をCanvas内座標に変換
  function getCanvasPosition(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) / currentScale,
      y: (clientY - rect.top) / currentScale,
    };
  }

  // タップ入力
  canvas.addEventListener('click', function (e) {
    SoundSystem.resume();
    const pos = getCanvasPosition(e);
    sceneManager.handleTap(pos.x, pos.y);
  });


  canvas.addEventListener('touchstart', function (e) {
    SoundSystem.resume();
    e.preventDefault();
    if (!e.touches || !e.touches[0]) return;
    var touch = e.touches[0];
    var rect = canvas.getBoundingClientRect();
    var tx = (touch.clientX - rect.left) / currentScale;
    var ty = (touch.clientY - rect.top) / currentScale;

    // バトル中: パッドボタンに触れたらシーンタップを送らない
    if (inputManager.virtualPadEnabled) {
      if (inputManager._hitTestPad(tx, ty)) return;
    }
    sceneManager.handleTap(tx, ty);
  }, { passive: false });

  // ゲームループ
  const FRAME_DURATION = 1000 / CONFIG.FPS;
  let lastTime = 0;
  let accumulator = 0;

  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    accumulator += delta;

    while (accumulator >= FRAME_DURATION) {
      inputManager.update();
      sceneManager.update(FRAME_DURATION);
      accumulator -= FRAME_DURATION;
    }

    ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    sceneManager.render(ctx);
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(function (timestamp) {
    lastTime = timestamp;
    requestAnimationFrame(loop);
  });
})();
