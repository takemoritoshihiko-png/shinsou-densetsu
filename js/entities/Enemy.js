// 敵キャラクター（トップダウン版）
class Enemy {
  constructor(stats) {
    this.isBoss = !!stats.isBoss;
    this.bossName = stats.bossName || '';
    this.spriteColor = stats.spriteColor || (this.isBoss ? '#8b0000' : '#dd3333');
    this.monsterName = stats.monsterName || '';
    this.race = stats.race || "";
    this.grade = stats.grade || 1;
    this.monsterColor = stats.color || this.spriteColor;
    this.monsterEye = stats.eye || "";
    this.monsterShape = stats.shape || "";
    this.hasCrown = !!stats.crown;
    this.hasFlame = !!stats.flame;
    this.hasSpark = !!stats.spark;
    this.hasAura = !!stats.aura;
    this.hasFire = !!stats.fire;
    this.hasWing = !!stats.wing;

    this.width = stats.width || (this.isBoss ? 40 : 26);
    this.height = stats.height || (this.isBoss ? 40 : 26);

    // フィールド上のランダム位置にスポーン (端から)
    var edge = Math.floor(Math.random() * 4);
    if (edge === 0) { this.x = Math.random() * CONFIG.FIELD_W; this.y = -30; }
    else if (edge === 1) { this.x = CONFIG.FIELD_W + 30; this.y = Math.random() * CONFIG.FIELD_H; }
    else if (edge === 2) { this.x = Math.random() * CONFIG.FIELD_W; this.y = CONFIG.FIELD_H + 30; }
    else { this.x = -30; this.y = Math.random() * CONFIG.FIELD_H; }

    this.speed = stats.speed || (this.isBoss ? 40 : 60);

    var s = StatusSystem.fromRaw(stats);
    this.hp = s.hp; this.hpMax = s.hp;
    this.atk = s.atk; this.matk = s.matk;
    this.def = s.def; this.mdef = s.mdef;
    this.spd = s.spd; this.crit = s.crit;

    this.rewardExp = stats.exp || 0;
    this.rewardGold = stats.gold || 0;

    this.attackRange = this.isBoss ? 50 : 35;
    this.attackInterval = stats.attackInterval || 1.5;
    this.attackTimer = 0;

    this.alive = true;
    this.deathEffect = false;
    this.deathTimer = 0;
    this.deathDuration = this.isBoss ? 600 : 300;

    // 移動AI
    this._wanderTimer = 0;
    this._wanderAngle = Math.random() * Math.PI * 2;
  }

  get exp() { return this.rewardExp; }
  get gold() { return this.rewardGold; }

  update(dt, player) {
    if (!this.alive) {
      if (this.deathEffect) {
        this.deathTimer += dt;
        if (this.deathTimer >= this.deathDuration) this.deathEffect = false;
      }
      return;
    }

    var sec = dt / 1000;
    var ecx = this.x + this.width / 2;
    var ecy = this.y + this.height / 2;
    var pcx = player.x + player.width / 2;
    var pcy = player.y + player.height / 2;
    var dx = pcx - ecx;
    var dy = pcy - ecy;
    var dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > this.attackRange) {
      // プレイヤーに向かって移動
      var nx = dx / dist;
      var ny = dy / dist;
      this.x += nx * this.speed * sec;
      this.y += ny * this.speed * sec;
    } else {
      // 攻撃
      this.attackTimer += sec;
      if (this.attackTimer >= this.attackInterval) {
        this.attackTimer = 0;
        this._attack(player, this._onDamageCallback);
      }
    }

    // フィールド内に制限
    if (this.x < -10) this.x = -10;
    if (this.y < -10) this.y = -10;
    if (this.x > CONFIG.FIELD_W + 10) this.x = CONFIG.FIELD_W + 10;
    if (this.y > CONFIG.FIELD_H + 10) this.y = CONFIG.FIELD_H + 10;
  }

  _attack(player, onDamage) {
    var result = CombatSystem.calcPhysical(this, player);
    CombatSystem.applyDamage(player, result.damage);
    if (onDamage) {
      onDamage(player.x + player.width / 2, player.y, result.damage, result.critical);
    }
  }

  takeDamage(amount) {
    if (!this.alive) return false;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.deathEffect = true;
      this.deathTimer = 0;
      return true;
    }
    return false;
  }

  isFinished() { return !this.alive && !this.deathEffect; }

  _getBodyType() {
    var sc = this.spriteColor || '#cc4444';
    var r = parseInt(sc.substr(1, 2), 16) || 0;
    var g = parseInt(sc.substr(3, 2), 16) || 0;
    var b = parseInt(sc.substr(5, 2), 16) || 0;
    if (g > r && g > b) return 'slime';
    if (r > g && r > b) return 'beast';
    if (b > r && b > g) return b > 150 ? 'flying' : 'humanoid';
    return 'elemental';
  }


  render(ctx) {
    if (this.deathEffect) { this._renderDeathEffect(ctx); return; }
    if (!this.alive) return;
    var ecx = this.x + this.width / 2, ecy = this.y + this.height / 2;
    var c = this.monsterColor || this.spriteColor;
    var t = Date.now();
    var r = this.width / 2;
    var bob = Math.sin(t * 0.005) * 2;
    ctx.save();

    if (this.isBoss) {
      // ボス描画
      ctx.globalAlpha = 0.15 + Math.sin(t * 0.003) * 0.05;
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(ecx, ecy, r + 12, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(ecx, ecy + r + 4, r, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(ecx, ecy, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#333'; ctx.beginPath(); ctx.moveTo(ecx-10,ecy-r+2); ctx.lineTo(ecx-14,ecy-r-16); ctx.lineTo(ecx-6,ecy-r+4); ctx.fill();
      ctx.beginPath(); ctx.moveTo(ecx+10,ecy-r+2); ctx.lineTo(ecx+14,ecy-r-16); ctx.lineTo(ecx+6,ecy-r+4); ctx.fill();
      ctx.fillStyle = '#ff4400'; ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(ecx-14,ecy-r-16,2,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(ecx+14,ecy-r-16,2,0,Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = '#ff2222'; ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.ellipse(ecx-8,ecy-4,5,3,0,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(ecx+8,ecy-4,5,3,0,0,Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;

    } else if (this.race === 'slime') {
      // スライム系
      var sq = Math.sin(t * 0.006) * 2;
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(ecx, ecy+r+2, r*0.8, 4, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(ecx, ecy+bob, r+sq, r-sq*0.5, 0, 0, Math.PI*2); ctx.fill();
      // ハイライト
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(ecx-3, ecy-4+bob, r*0.35, r*0.25, -0.3, 0, Math.PI*2); ctx.fill();
      // 目
      var eyeY = ecy - 2 + bob;
      if (this.monsterEye === 'cute') {
        ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(ecx-4, eyeY, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(ecx+4, eyeY, 2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ecx-4.5, eyeY-1, 0.8, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(ecx+3.5, eyeY-1, 0.8, 0, Math.PI*2); ctx.fill();
      } else if (this.monsterEye === 'glow') {
        ctx.fillStyle = '#44ff44'; ctx.shadowColor = '#44ff44'; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(ecx-4, eyeY, 2.5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(ecx+4, eyeY, 2.5, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
      } else if (this.monsterEye === 'king') {
        ctx.fillStyle = '#ffcc00'; ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 4;
        ctx.beginPath(); ctx.arc(ecx-5, eyeY, 2.5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(ecx+5, eyeY, 2.5, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ecx-4, eyeY, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(ecx+4, eyeY, 3, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(ecx-3.5, eyeY+0.5, 1.5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(ecx+4.5, eyeY+0.5, 1.5, 0, Math.PI*2); ctx.fill();
      }
      if (this.hasCrown) { ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.moveTo(ecx-6,ecy-r+bob); ctx.lineTo(ecx-7,ecy-r-8+bob); ctx.lineTo(ecx-3,ecy-r-4+bob); ctx.lineTo(ecx,ecy-r-10+bob); ctx.lineTo(ecx+3,ecy-r-4+bob); ctx.lineTo(ecx+7,ecy-r-8+bob); ctx.lineTo(ecx+6,ecy-r+bob); ctx.closePath(); ctx.fill(); }
      if (this.hasSpark) { ctx.strokeStyle = '#ffff44'; ctx.lineWidth = 1.5; for (var si=0;si<3;si++){var sa=t*0.01+si*2.1; ctx.beginPath(); ctx.moveTo(ecx+Math.cos(sa)*(r+2),ecy+Math.sin(sa)*(r+2)+bob); ctx.lineTo(ecx+Math.cos(sa)*(r+6),ecy+Math.sin(sa)*(r+6)+bob); ctx.stroke();} }
      if (this.hasFlame) { ctx.fillStyle = '#ff4400'; ctx.globalAlpha = 0.5+Math.sin(t*0.01)*0.2; for(var fi=0;fi<4;fi++){var fa=t*0.008+fi*1.5; ctx.beginPath(); ctx.arc(ecx+Math.cos(fa)*(r+3),ecy-r+Math.sin(fa)*4+bob-2,3,0,Math.PI*2); ctx.fill();} ctx.globalAlpha=1; }

    } else if (this.race === 'beast') {
      // 獣系
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(ecx, ecy+r+2, r*0.8, 4, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(ecx, ecy+bob, r+1, r-1, 0, 0, Math.PI*2); ctx.fill();
      // 耳
      if (this.monsterShape==='rabbit') { ctx.fillStyle=c; ctx.beginPath(); ctx.ellipse(ecx-5,ecy-r-5+bob,3,8,0.2,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(ecx+5,ecy-r-5+bob,3,8,-0.2,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#ffaaaa'; ctx.beginPath(); ctx.ellipse(ecx-5,ecy-r-5+bob,1.5,5,0.2,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(ecx+5,ecy-r-5+bob,1.5,5,-0.2,0,Math.PI*2); ctx.fill(); }
      else if (this.monsterShape==='dog'||this.monsterShape==='wolf') { ctx.fillStyle=c; ctx.beginPath(); ctx.moveTo(ecx-8,ecy-r+2+bob); ctx.lineTo(ecx-11,ecy-r-7+bob); ctx.lineTo(ecx-4,ecy-r+3+bob); ctx.fill(); ctx.beginPath(); ctx.moveTo(ecx+8,ecy-r+2+bob); ctx.lineTo(ecx+11,ecy-r-7+bob); ctx.lineTo(ecx+4,ecy-r+3+bob); ctx.fill(); }
      else if (this.monsterShape==='fox') { ctx.fillStyle='#dd8833'; ctx.beginPath(); ctx.moveTo(ecx-7,ecy-r+2+bob); ctx.lineTo(ecx-12,ecy-r-9+bob); ctx.lineTo(ecx-3,ecy-r+3+bob); ctx.fill(); ctx.beginPath(); ctx.moveTo(ecx+7,ecy-r+2+bob); ctx.lineTo(ecx+12,ecy-r-9+bob); ctx.lineTo(ecx+3,ecy-r+3+bob); ctx.fill(); }
      else if (this.monsterShape==='boar') { ctx.fillStyle='#443322'; ctx.beginPath(); ctx.moveTo(ecx-6,ecy-r+bob); ctx.lineTo(ecx-8,ecy-r-4+bob); ctx.lineTo(ecx-3,ecy-r+1+bob); ctx.fill(); ctx.beginPath(); ctx.moveTo(ecx+6,ecy-r+bob); ctx.lineTo(ecx+8,ecy-r-4+bob); ctx.lineTo(ecx+3,ecy-r+1+bob); ctx.fill(); ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(ecx-4,ecy+3+bob,1.5,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(ecx+4,ecy+3+bob,1.5,0,Math.PI*2); ctx.fill(); }
      else if (this.monsterShape==='bear') { ctx.fillStyle=c; ctx.beginPath(); ctx.arc(ecx-8,ecy-r+2+bob,4,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(ecx+8,ecy-r+2+bob,4,0,Math.PI*2); ctx.fill(); }
      else if (this.monsterShape==='griffon') { ctx.fillStyle=c+'aa'; var wa=Math.sin(t*0.01)*0.3; ctx.save(); ctx.translate(ecx,ecy+bob); ctx.rotate(-wa-0.3); ctx.beginPath(); ctx.moveTo(-3,0); ctx.quadraticCurveTo(-18,-12,-16,2); ctx.fill(); ctx.restore(); ctx.save(); ctx.translate(ecx,ecy+bob); ctx.rotate(wa+0.3); ctx.beginPath(); ctx.moveTo(3,0); ctx.quadraticCurveTo(18,-12,16,2); ctx.fill(); ctx.restore(); }
      else if (this.monsterShape==='chimera') { ctx.fillStyle='#228833'; ctx.beginPath(); ctx.moveTo(ecx+r,ecy+bob); ctx.quadraticCurveTo(ecx+r+8,ecy-5+bob,ecx+r+4,ecy+5+bob); ctx.fill(); ctx.fillStyle='#882244'; var wa2=Math.sin(t*0.008)*0.4; ctx.save(); ctx.translate(ecx,ecy+bob); ctx.rotate(-wa2); ctx.beginPath(); ctx.moveTo(-4,-2); ctx.lineTo(-18,-14); ctx.lineTo(-12,0); ctx.fill(); ctx.restore(); ctx.save(); ctx.translate(ecx,ecy+bob); ctx.rotate(wa2); ctx.beginPath(); ctx.moveTo(4,-2); ctx.lineTo(18,-14); ctx.lineTo(12,0); ctx.fill(); ctx.restore(); }
      // 目
      ctx.fillStyle = (this.grade>=5) ? '#ff4444' : '#111';
      ctx.beginPath(); ctx.arc(ecx-4,ecy-2+bob,2,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(ecx+4,ecy-2+bob,2,0,Math.PI*2); ctx.fill();

    } else if (this.race === 'dragon') {
      // ドラゴン系
      var dr = r * (this.grade >= 5 ? 1.2 : 1);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(ecx,ecy+dr+2,dr*0.8,5,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(ecx,ecy+bob,dr,dr*0.85,0,0,Math.PI*2); ctx.fill();
      // 翼
      var wa3 = Math.sin(t*0.008)*0.3;
      ctx.fillStyle = c+'88'; ctx.save(); ctx.translate(ecx,ecy+bob); ctx.rotate(-wa3-0.4);
      ctx.beginPath(); ctx.moveTo(-4,0); ctx.quadraticCurveTo(-dr-8,-dr+2,-dr-4,4); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(ecx,ecy+bob); ctx.rotate(wa3+0.4);
      ctx.beginPath(); ctx.moveTo(4,0); ctx.quadraticCurveTo(dr+8,-dr+2,dr+4,4); ctx.fill(); ctx.restore();
      // 角
      ctx.fillStyle = '#555'; ctx.beginPath(); ctx.moveTo(ecx-5,ecy-dr+bob); ctx.lineTo(ecx-7,ecy-dr-6+bob); ctx.lineTo(ecx-3,ecy-dr+1+bob); ctx.fill();
      ctx.beginPath(); ctx.moveTo(ecx+5,ecy-dr+bob); ctx.lineTo(ecx+7,ecy-dr-6+bob); ctx.lineTo(ecx+3,ecy-dr+1+bob); ctx.fill();
      // 目
      ctx.fillStyle = this.grade>=5 ? '#ff4400' : '#ffcc00';
      if (this.grade>=5) { ctx.shadowColor='#ff4400'; ctx.shadowBlur=4; }
      ctx.beginPath(); ctx.arc(ecx-5,ecy-3+bob,2.5,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(ecx+5,ecy-3+bob,2.5,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
      ctx.fillStyle='#000'; ctx.fillRect(ecx-5.5,ecy-4.5+bob,1,3); ctx.fillRect(ecx+4.5,ecy-4.5+bob,1,3);
      // 炎
      if (this.hasFire) { ctx.fillStyle='#ff6600'; ctx.globalAlpha=0.6; for(var fi2=0;fi2<3;fi2++){ctx.beginPath(); ctx.arc(ecx+Math.sin(t*0.01+fi2)*5,ecy+dr+bob-2+Math.cos(t*0.012+fi2)*3,2.5,0,Math.PI*2); ctx.fill();} ctx.globalAlpha=1; }
      if (this.hasAura) { ctx.strokeStyle=c; ctx.globalAlpha=0.2; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(ecx,ecy+bob,dr+8,0,Math.PI*2); ctx.stroke(); ctx.globalAlpha=1; }

    } else if (this.race === 'bandit') {
      // 盗賊系
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(ecx,ecy+r+2,r*0.6,3,0,0,Math.PI*2); ctx.fill();
      // 体（人型）
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(ecx-7,ecy-4+bob); ctx.lineTo(ecx+7,ecy-4+bob);
      ctx.lineTo(ecx+6,ecy+8+bob); ctx.lineTo(ecx-6,ecy+8+bob); ctx.closePath(); ctx.fill();
      // 頭
      ctx.fillStyle = '#e8c090'; ctx.beginPath(); ctx.arc(ecx,ecy-8+bob,6,0,Math.PI*2); ctx.fill();
      // フード/髪
      if (this.grade>=5) { ctx.fillStyle='#333344'; ctx.beginPath(); ctx.arc(ecx,ecy-9+bob,7,Math.PI*1.1,Math.PI*1.9,true); ctx.fill(); ctx.beginPath(); ctx.moveTo(ecx-5,ecy-14+bob); ctx.lineTo(ecx,ecy-18+bob); ctx.lineTo(ecx+5,ecy-14+bob); ctx.fill(); }
      else { ctx.fillStyle='#886644'; ctx.beginPath(); ctx.arc(ecx,ecy-9+bob,6.5,Math.PI*1.1,Math.PI*1.9,true); ctx.fill(); }
      // 足
      ctx.fillStyle = '#555'; ctx.fillRect(ecx-5,ecy+8+bob,4,5); ctx.fillRect(ecx+1,ecy+8+bob,4,5);
      // 目
      ctx.fillStyle = this.grade>=7 ? '#ff4444' : '#222';
      ctx.beginPath(); ctx.arc(ecx-3,ecy-8+bob,1.5,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(ecx+3,ecy-8+bob,1.5,0,Math.PI*2); ctx.fill();
      // 武器
      if (this.monsterShape==='archer') { ctx.strokeStyle='#886644'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(ecx+10,ecy-2+bob,8,Math.PI*0.3,Math.PI*1.7); ctx.stroke(); }
      else if (this.monsterShape==='mage') { ctx.strokeStyle='#664488'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(ecx+9,ecy-12+bob); ctx.lineTo(ecx+9,ecy+6+bob); ctx.stroke(); ctx.fillStyle='#aa66ff'; ctx.beginPath(); ctx.arc(ecx+9,ecy-14+bob,3,0,Math.PI*2); ctx.fill(); }
      else if (this.monsterShape==='king') { ctx.fillStyle='#ffd700'; ctx.beginPath(); ctx.moveTo(ecx-5,ecy-14+bob); ctx.lineTo(ecx-6,ecy-20+bob); ctx.lineTo(ecx-2,ecy-17+bob); ctx.lineTo(ecx,ecy-22+bob); ctx.lineTo(ecx+2,ecy-17+bob); ctx.lineTo(ecx+6,ecy-20+bob); ctx.lineTo(ecx+5,ecy-14+bob); ctx.closePath(); ctx.fill(); }
      else { ctx.fillStyle='#888'; ctx.save(); ctx.translate(ecx+8,ecy-2+bob); ctx.rotate(0.3); ctx.fillRect(-1,-10,2,12); ctx.restore(); }

    } else {
      // フォールバック（丸）
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(ecx,ecy+r+2,r*0.8,4,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(ecx,ecy+bob,r,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(ecx-4,ecy-2+bob,3,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(ecx+4,ecy-2+bob,3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#111'; ctx.beginPath(); ctx.arc(ecx-3,ecy-1+bob,1.5,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(ecx+5,ecy-1+bob,1.5,0,Math.PI*2); ctx.fill();
    }

    // HPバー
    if (!this.isBoss) {
      var bw=this.width+6, bh=4, bx=ecx-bw/2, by=this.y-8;
      var ratio=this.hpMax>0?this.hp/this.hpMax:0;
      ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(bx,by,bw,bh);
      ctx.fillStyle=ratio>0.5?'#44cc44':ratio>0.2?'#ccaa22':'#cc2222';
      ctx.fillRect(bx,by,bw*ratio,bh);
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1; ctx.strokeRect(bx,by,bw,bh);
      // 名前
      ctx.font='8px '+CONFIG.FONT_FAMILY; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.fillText(this.monsterName,ecx,this.y-14);
    }
    ctx.restore();
  }

  _renderDeathEffect(ctx) {
    var p = this.deathTimer / this.deathDuration;
    var cx = this.x + this.width / 2, cy = this.y + this.height / 2;
    var c = this.monsterColor || this.spriteColor;
    ctx.save(); ctx.globalAlpha = 1 - p;
    if (this.isBoss) {
      for (var ri=0;ri<3;ri++){var rp=Math.max(0,p-ri*0.15); ctx.strokeStyle=ri===0?'#ffd700':'#ff6600'; ctx.lineWidth=(1-rp)*3; ctx.beginPath(); ctx.arc(cx,cy,15+40*rp,0,Math.PI*2); ctx.stroke();}
      for (var gi=0;gi<12;gi++){var ga=Math.PI*2/12*gi,gd=25*p; ctx.fillStyle=gi%2===0?'#ffd700':'#ffaa44'; ctx.beginPath(); ctx.arc(cx+Math.cos(ga)*gd,cy+Math.sin(ga)*gd,2*(1-p),0,Math.PI*2); ctx.fill();}
    } else {
      for (var i=0;i<10;i++){var a=Math.PI*2/10*i+p*2,d=16*p; ctx.fillStyle=i%2===0?c:'#ffffff'; ctx.beginPath(); ctx.arc(cx+Math.cos(a)*d,cy+Math.sin(a)*d,2.5*(1-p),0,Math.PI*2); ctx.fill();}
    }
    ctx.restore();
  }

  _roundRect(ctx, x, y, w, h, r2) {
    if (w < 1 || h < 1) return;
    r2 = Math.min(r2, w/2, h/2);
    ctx.beginPath(); ctx.moveTo(x+r2,y); ctx.lineTo(x+w-r2,y);
    ctx.quadraticCurveTo(x+w,y,x+w,y+r2); ctx.lineTo(x+w,y+h-r2);
    ctx.quadraticCurveTo(x+w,y+h,x+w-r2,y+h); ctx.lineTo(x+r2,y+h);
    ctx.quadraticCurveTo(x,y+h,x,y+h-r2); ctx.lineTo(x,y+r2);
    ctx.quadraticCurveTo(x,y,x+r2,y); ctx.closePath(); ctx.fill();
  }
}
