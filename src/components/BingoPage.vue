<template>
  <div class="rascaro-bingo">
    <h1>RascaroBingo V1.0</h1>

    <!-- Risk Management Section -->
    <div class="risk-management">
      <h2>Risk Management</h2>
      <el-slider
        v-model="riskManagementValue"
        :step="0.25"
        :min="0"
        :max="1"
        @change="updateRiskManagement"
      ></el-slider>
      <div>{{ riskManagementLabel }}</div>
      
      <div>
        <span>Number of SL taken: </span>
        <el-slider
          v-model="slTaken"
          :step="1"
          :min="0"
          :max="3"
          @change="updateSlTaken"
        ></el-slider>
      </div>
      
      <el-switch
        v-model="stopTrading"
        active-text="STOP TRADING for the day!"
      ></el-switch>
      
      <div>
        <h3>Trade's reasons</h3>
        <el-input
          type="textarea"
          v-model="tradeReason"
          placeholder="Explain your trade!"
        ></el-input>
      </div>
    </div>

    <!-- Risk/Reward Section -->
    <div class="risk-reward">
      <h2>Points Bingo: Risk/Reward</h2>
      <el-checkbox v-model="rr1" disabled>3/11: 2R/R</el-checkbox>
      <el-checkbox v-model="rr2" disabled>5/11: 3R/R</el-checkbox>
      <el-checkbox v-model="rr3" disabled>7/11: BINGO ! 4R/R</el-checkbox>
    </div>

    <!-- Long/Short Tabs -->
    <el-tabs v-model="activeTab">
      <el-tab-pane label="Short" name="short">
        <h3>Risk Appetite:</h3>
        <el-checkbox v-model="shortRiskx1">Normal bet (x1 + 0R)</el-checkbox>
        <el-checkbox v-model="shortRiskx2">Double bet (x2 - 1R)</el-checkbox>
        <el-checkbox v-model="shortRiskx3">Triple bet (x3 - 2R)</el-checkbox>
        
        <h3>Prices:</h3>
        <el-input v-model="shortStoploss" placeholder="Stoploss Price $"></el-input>
        <el-input v-model="shortEntry" placeholder="Entry Price $"></el-input>
        <el-input v-model="shortTarget" placeholder="Target Price $"></el-input>
        <el-input v-model="shortClosed" placeholder="Closed Price $"></el-input>
      </el-tab-pane>
      <el-tab-pane label="Long" name="long">
        <h3>Risk Appetite:</h3>
        <el-checkbox v-model="longRiskx1">Normal bet (x1 + 0R)</el-checkbox>
        <el-checkbox v-model="longRiskx2">Double bet (x2 - 1R)</el-checkbox>
        <el-checkbox v-model="longRiskx3">Triple bet (x3 - 2R)</el-checkbox>
        
        <h3>Prices:</h3>
        <el-input v-model="longStoploss" placeholder="Stoploss Price $"></el-input>
        <el-input v-model="longEntry" placeholder="Entry Price $"></el-input>
        <el-input v-model="longTarget" placeholder="Target Price $"></el-input>
        <el-input v-model="longClosed" placeholder="Closed Price $"></el-input>
      </el-tab-pane>
    </el-tabs>

    <!-- Bingo Section -->
    <div class="bingo-section">
      <h2>Here we cooking da Bingo</h2>
      
      <!-- Bingo cases -->
      <div class="bingo-case">
        <el-checkbox v-model="rsi1" @change="checkboxEvent">1 Stoch RSI >= 5: 1 point</el-checkbox>
        <el-checkbox v-model="rsi2" @change="checkboxEvent">3 Stoch RSI >= 4: 2 points</el-checkbox>
      </div>
      
      <div class="bingo-case">
        <el-checkbox v-model="sfp" @change="checkboxEvent">SFP + 0.0 exochart: 1 point</el-checkbox>
      </div>
      
      <div class="bingo-case">
        <el-checkbox v-model="tradeTendance" @change="checkboxEvent">Trade suivant la tendance : 1 point (Long en haussière / Short en baissière)</el-checkbox>
        <el-checkbox v-model="cvd" @change="checkboxEvent">Trade en accord avec CVD: 1 point (Contretrade lorsque CVD divergence avec prix)</el-checkbox>
      </div>
      
      <div class="bingo-case">
        <el-checkbox v-model="liquidityPool" @change="checkboxEvent">Fade after gap filled / liquidity pool reached: 1 point</el-checkbox>
        <el-checkbox v-model="liquidationMap" @change="checkboxEvent">Easier to liquidate your way ? (by the script): 1 point</el-checkbox>
      </div>
      
      <div class="bingo-case">
        <el-checkbox v-model="strategyLiquidation1" @change="checkboxEvent">Strategy candleclose after BTC liqui > 30: 1 point</el-checkbox>
        <el-checkbox v-model="strategyLiquidation2" @change="checkboxEvent">Strategy candleclose after BTC liqui > 100: 2 points</el-checkbox>
      </div>
      
      <div class="bingo-case">
        <el-checkbox v-model="shortLongRatio1" @change="checkboxEvent">Long on ratio > 2 / Short on ratio inf 1: 1 point</el-checkbox>
        <el-checkbox v-model="shortLongRatio2" @change="checkboxEvent">Short / long on ratio > Old high: 2 points</el-checkbox>
      </div>
    </div>

    <el-button @click="calculateBingo">Check Bingo</el-button>
  </div>
</template>

<script>
export default {
  name: 'RascaroBingo',
  data() {
    return {
      riskManagementValue: 0.5,
      riskManagementLabel: 'Normal trade: 0 (10% of trading stack)',
      slTaken: 0,
      stopTrading: false,
      tradeReason: '',
      rr1: false,
      rr2: false,
      rr3: false,
      activeTab: 'short',
      shortRiskx1: false,
      shortRiskx2: false,
      shortRiskx3: false,
      longRiskx1: false,
      longRiskx2: false,
      longRiskx3: false,
      shortStoploss: '',
      shortEntry: '',
      shortTarget: '',
      shortClosed: '',
      longStoploss: '',
      longEntry: '',
      longTarget: '',
      longClosed: '',
      rsi1: false,
      rsi2: false,
      sfp: false,
      tradeTendance: false,
      cvd: false,
      liquidityPool: false,
      liquidationMap: false,
      strategyLiquidation1: false,
      strategyLiquidation2: false,
      shortLongRatio1: false,
      shortLongRatio2: false,
      pointsBingo: 0
    }
  },
  methods: {
    updateRiskManagement(value) {
      if (value === 0) {
        this.riskManagementLabel = 'Malus streak: /3 (3.33% of trading stack)'
      } else if (value === 0.25) {
        this.riskManagementLabel = 'Malus streak: /2 (5% of trading stack)'
      } else if (value === 0.5) {
        this.riskManagementLabel = 'Normal trade: 0 (10% of trading stack)'
      } else if (value === 0.75) {
        this.riskManagementLabel = 'Bonus streak: x1.5 (15% of trading stack)'
      } else if (value === 1) {
        this.riskManagementLabel = 'Bonus streak: x2 (20% of trading stack)'
      }
    },
    updateSlTaken(value) {
      this.stopTrading = value === 3
    },
    checkboxEvent() {
      this.isCheckboxChecked()
      this.calculateBingo()
    },
    isCheckboxChecked() {
      if (this.rsi2 && this.rsi1) this.rsi1 = false
      if (this.shortLongRatio2 && this.shortLongRatio1) this.shortLongRatio1 = false
      if (this.strategyLiquidation2 && this.strategyLiquidation1) this.strategyLiquidation1 = false
    },
    calculateBingo() {
      this.pointsBingo = 0
      if (this.rsi1) this.pointsBingo += 1
      if (this.rsi2) this.pointsBingo += 2
      if (this.sfp) this.pointsBingo += 1
      if (this.tradeTendance) this.pointsBingo += 1
      if (this.cvd) this.pointsBingo += 1
      if (this.liquidityPool) this.pointsBingo += 1
      if (this.liquidationMap) this.pointsBingo += 1
      if (this.strategyLiquidation1) this.pointsBingo += 1
      if (this.strategyLiquidation2) this.pointsBingo += 2
      if (this.shortLongRatio1) this.pointsBingo += 1
      if (this.shortLongRatio2) this.pointsBingo += 2

      this.updateRiskReward()
    },
    updateRiskReward() {
      this.rr1 = this.pointsBingo >= 3
      this.rr2 = this.pointsBingo >= 5
      this.rr3 = this.pointsBingo >= 7
    }
  }
}
</script>

<style scoped>
.rascaro-bingo {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.risk-management, .risk-reward, .bingo-section {
  margin-bottom: 20px;
}

.bingo-case {
  margin-bottom: 10px;
}
</style>