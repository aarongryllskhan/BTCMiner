function getTotalCryptoValue(){try{const btcPrice=typeof BTC_PRICE!=='undefined'?BTC_PRICE:99975;const ethPrice=typeof ETH_PRICE!=='undefined'?ETH_PRICE:3499;const dogePrice=typeof DOGE_PRICE!=='undefined'?DOGE_PRICE:0.35;const btcBal=typeof btcBalance!=='undefined'?btcBalance:0;const ethBal=typeof ethBalance!=='undefined'?ethBalance:0;const dogeBal=typeof dogeBalance!=='undefined'?dogeBalance:0;const portfolioValue=(btcBal*btcPrice)+(ethBal*ethPrice)+(dogeBal*dogePrice);return portfolioValue}catch(e){console.log('🎓 Error calculating portfolio value:',e);return 0}}
function saveTutorialState(){const state={completed:tutorialData.completed,currentStep:tutorialData.currentStep,cryptoSoldOnce:tutorialData.cryptoSoldOnce,powerUpgradeClicked:tutorialData.powerUpgradeClicked,btcTabClicked:tutorialData.btcTabClicked,ethTabClicked:tutorialData.ethTabClicked,dogeTabClicked:tutorialData.dogeTabClicked};localStorage.setItem('tutorialState',JSON.stringify(state));console.log('🎓 Tutorial state saved:',state)}
function loadTutorialState(){const saved=localStorage.getItem('tutorialState');if(saved){try{const state=JSON.parse(saved);tutorialData.completed=state.completed||!1;tutorialData.currentStep=state.currentStep||0;tutorialData.cryptoSoldOnce=state.cryptoSoldOnce||!1;tutorialData.powerUpgradeClicked=state.powerUpgradeClicked||!1;tutorialData.btcTabClicked=state.btcTabClicked||!1;tutorialData.ethTabClicked=state.ethTabClicked||!1;tutorialData.dogeTabClicked=state.dogeTabClicked||!1;console.log('🎓 Tutorial state loaded:',state);return!0}catch(e){console.log('🎓 Error loading tutorial state:',e);return!1}}
return!1}
let tutorialData={completed:!1,currentStep:0,cryptoSoldOnce:!1,btcTabClicked:!1,ethTabClicked:!1,dogeTabClicked:!1,steps:[{id:'manual_hash',title:'Start Mining!',description:'Click the manual hash buttons AND/OR use the AUTO CLICKER to earn cryptocurrency. Earn at least $30 to continue! 💰',targets:['manual-hash-btc-btn','manual-hash-eth-btn','manual-hash-doge-btn','autoclicker-btn'],trigger:'clicks_made',nextCondition:()=>{try{return getTotalCryptoValue()>=30}catch(e){return!1}},highlightClass:'tutorial-highlight'},{id:'crypto_exchange',title:'Exchange Your Crypto',description:'Great! Now you need to sell your cryptocurrency for USD. Open the Exchange tab and click "SELL ALL" to convert at least $30 worth of crypto to cash.',targets:['crypto-exchange-btn'],trigger:'manual',nextCondition:()=>typeof dollarBalance!=='undefined'&&dollarBalance>=30,highlightClass:'tutorial-highlight-urgent',customHighlight:()=>{const btcEl=document.getElementById('bal-btc');const ethEl=document.getElementById('bal-eth');const dogeEl=document.getElementById('bal-doge');if(btcEl)btcEl.style.boxShadow='0 0 30px rgba(255, 215, 0, 0.8)';if(ethEl)ethEl.style.boxShadow='0 0 30px rgba(255, 215, 0, 0.8)';if(dogeEl)dogeEl.style.boxShadow='0 0 30px rgba(255, 215, 0, 0.8)';const cashEl=document.getElementById('player-cash-display');if(cashEl){cashEl.style.cssText=`
                        border: 3px dashed #FFD700 !important;
                        box-shadow: 0 0 30px rgba(255, 215, 0, 0.9) !important;
                        padding: 8px !important;
                        border-radius: 6px !important;
                    `}
document.querySelectorAll('button').forEach(btn=>{if(btn.textContent.includes('SELL ALL')){btn.style.animation='tutorial-flash 0.6s infinite';btn.style.zIndex='9991'}})}},{id:'power_button',title:'Upgrade Power Supply',description:'Great! Now that you have cash, click the "UPGRADE POWER SUPPLY" button to increase your mining capacity.',targets:['power-upgrade-btn'],trigger:'manual',nextCondition:()=>tutorialData.powerUpgradeClicked,highlightClass:'tutorial-highlight-urgent'},{id:'buy_power_supply',title:'Buy Basic Power Strip',description:'In the Power tab, find and buy the "Basic Power Strip" upgrade. This lets you run more miners at once.',targets:[],trigger:'manual',nextCondition:()=>typeof powerUpgrades!=='undefined'&&powerUpgrades[0]&&powerUpgrades[0].level>0,highlightClass:'tutorial-highlight-urgent',autoAdvance:!0,customHighlight:()=>{setTimeout(()=>{const basicPowerStripBtn=document.getElementById('pow-0');if(basicPowerStripBtn){basicPowerStripBtn.style.cssText=`
                            border: 3px dashed #FFD700 !important;
                            box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), inset 0 0 10px rgba(255, 215, 0, 0.2) !important;
                            position: relative !important;
                            z-index: 9991 !important;
                            outline: 2px solid #FFD700 !important;
                            outline-offset: 2px !important;
                        `;console.log('🎓 Basic Power Strip highlighted successfully via ID pow-0')}else{console.log('🎓 Could not find Basic Power Strip button with ID pow-0 - trying text search fallback');let found=!1;document.querySelectorAll('button.u-item').forEach(el=>{if(el.textContent.includes('Basic Power Strip')){el.style.cssText=`
                                    border: 3px dashed #FFD700 !important;
                                    box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), inset 0 0 10px rgba(255, 215, 0, 0.2) !important;
                                    position: relative !important;
                                    z-index: 9991 !important;
                                    outline: 2px solid #FFD700 !important;
                                    outline-offset: 2px !important;
                                `;console.log('🎓 Basic Power Strip found and highlighted via text search');found=!0}});if(!found){console.log('🎓 Basic Power Strip button not found - power shop may not be rendered yet')}}},300)}},{id:'btc_tab',title:'Mine Bitcoin',description:'Perfect! Now that you have more power capacity, click the BTC tab to see Bitcoin mining equipment.',targets:['btc-tab-btn'],trigger:'manual',nextCondition:()=>tutorialData.btcTabClicked,highlightClass:'tutorial-highlight',autoAdvance:!0},{id:'buy_usb_miner',title:'Buy USB Miner',description:'In the BTC tab, buy a "USB Miner" to start passive Bitcoin mining. It will generate income automatically!',targets:['btc-shop'],trigger:'manual',nextCondition:()=>typeof btcUpgrades!=='undefined'&&btcUpgrades[1]&&btcUpgrades[1].level>0,highlightClass:'tutorial-highlight-urgent',autoAdvance:!0,customHighlight:()=>{setTimeout(()=>{const usbMinerBtn=document.getElementById('up-1');if(usbMinerBtn){usbMinerBtn.style.cssText=`
                            border: 3px dashed #FFD700 !important;
                            box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), inset 0 0 10px rgba(255, 215, 0, 0.2) !important;
                            position: relative !important;
                            z-index: 9991 !important;
                            outline: 2px solid #FFD700 !important;
                            outline-offset: 2px !important;
                        `;console.log('🎓 USB Miner highlighted successfully via ID up-1')}else{console.log('🎓 Could not find USB Miner button with ID up-1 - trying text search fallback');let found=!1;document.querySelectorAll('button.u-item').forEach(el=>{if(el.textContent.includes('USB Miner')){el.style.cssText=`
                                    border: 3px dashed #FFD700 !important;
                                    box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), inset 0 0 10px rgba(255, 215, 0, 0.2) !important;
                                    position: relative !important;
                                    z-index: 9991 !important;
                                    outline: 2px solid #FFD700 !important;
                                    outline-offset: 2px !important;
                                `;console.log('🎓 USB Miner found and highlighted via text search');found=!0}});if(!found){console.log('🎓 USB Miner button not found - BTC shop may not be rendered yet')}}},300)}},{id:'buy_eth_miner',title:'Mine Ethereum',description:'Now let\'s diversify! Click the ETH tab to see Ethereum mining equipment.',targets:['eth-tab-btn'],trigger:'manual',nextCondition:()=>typeof tutorialData!=='undefined'&&tutorialData.ethTabClicked,highlightClass:'tutorial-highlight-urgent',autoAdvance:!0,hideGotItButton:!0},{id:'buy_gpu_rig',title:'Buy Single GPU Rig',description:'In the ETH tab, purchase a "Single GPU Rig" to start mining Ethereum. You can\'t proceed without buying one!',targets:['eth-shop'],trigger:'manual',nextCondition:()=>typeof ethUpgrades!=='undefined'&&ethUpgrades[1]&&ethUpgrades[1].level>0,highlightClass:'tutorial-highlight-urgent',autoAdvance:!0,hideGotItButton:!0,customHighlight:()=>{setTimeout(()=>{const gpuRigBtn=document.getElementById('up-1-eth')||document.getElementById('ue-1');if(gpuRigBtn){gpuRigBtn.style.cssText=`
                            border: 3px dashed #FFD700 !important;
                            box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), inset 0 0 10px rgba(255, 215, 0, 0.2) !important;
                            position: relative !important;
                            z-index: 9991 !important;
                            outline: 2px solid #FFD700 !important;
                            outline-offset: 2px !important;
                        `;console.log('🎓 Single GPU Rig highlighted successfully')}else{console.log('🎓 Could not find GPU Rig button - trying text search fallback');let found=!1;document.querySelectorAll('button.u-item').forEach(el=>{if(el.textContent.includes('Single GPU Rig')){el.style.cssText=`
                                    border: 3px dashed #FFD700 !important;
                                    box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), inset 0 0 10px rgba(255, 215, 0, 0.2) !important;
                                    position: relative !important;
                                    z-index: 9991 !important;
                                    outline: 2px solid #FFD700 !important;
                                    outline-offset: 2px !important;
                                `;console.log('🎓 Single GPU Rig found and highlighted via text search');found=!0}});if(!found){console.log('🎓 Single GPU Rig button not found - ETH shop may not be rendered yet')}}},300)}},{id:'buy_doge_miner',title:'Mine Dogecoin',description:'Let\'s complete the trifecta! Click the DOGE tab to see Dogecoin mining equipment.',targets:['doge-tab-btn'],trigger:'manual',nextCondition:()=>typeof tutorialData!=='undefined'&&tutorialData.dogeTabClicked,highlightClass:'tutorial-highlight-urgent',autoAdvance:!0,hideGotItButton:!0},{id:'buy_scrypt_miner',title:'Buy Basic Scrypt Miner',description:'In the DOGE tab, purchase a "Basic Scrypt Miner" to start mining Dogecoin. You can\'t proceed without buying one!',targets:['doge-shop'],trigger:'manual',nextCondition:()=>typeof dogeUpgrades!=='undefined'&&dogeUpgrades[1]&&dogeUpgrades[1].level>0,highlightClass:'tutorial-highlight-urgent',autoAdvance:!0,hideGotItButton:!0,customHighlight:()=>{setTimeout(()=>{const scryptBtn=document.getElementById('up-1-doge')||document.getElementById('ud-1');if(scryptBtn){scryptBtn.style.cssText=`
                            border: 3px dashed #FFD700 !important;
                            box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), inset 0 0 10px rgba(255, 215, 0, 0.2) !important;
                            position: relative !important;
                            z-index: 9991 !important;
                            outline: 2px solid #FFD700 !important;
                            outline-offset: 2px !important;
                        `;console.log('🎓 Basic Scrypt Miner highlighted successfully')}else{console.log('🎓 Could not find Scrypt Miner button - trying text search fallback');let found=!1;document.querySelectorAll('button.u-item').forEach(el=>{if(el.textContent.includes('Basic Scrypt Miner')){el.style.cssText=`
                                    border: 3px dashed #FFD700 !important;
                                    box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), inset 0 0 10px rgba(255, 215, 0, 0.2) !important;
                                    position: relative !important;
                                    z-index: 9991 !important;
                                    outline: 2px solid #FFD700 !important;
                                    outline-offset: 2px !important;
                                `;console.log('🎓 Basic Scrypt Miner found and highlighted via text search');found=!0}});if(!found){console.log('🎓 Basic Scrypt Miner button not found - DOGE shop may not be rendered yet')}}},300)}},{id:'hashrate_display',title:'Monitor Your Hashrate',description:'These bars display your current HASHRATE in $/sec for each cryptocurrency. This shows how much value you\'re earning per second from your miners!',targets:[],trigger:'manual',nextCondition:()=>!0,highlightClass:'tutorial-highlight',customHighlight:()=>{setTimeout(()=>{const hashrateBtc=document.getElementById('btc-hashrate-bar');if(hashrateBtc){const hashrateContainer=hashrateBtc.parentElement?.parentElement?.parentElement;if(hashrateContainer){hashrateContainer.style.cssText=`
                                border: 3px dashed #FFD700 !important;
                                box-shadow: 0 0 30px rgba(255, 215, 0, 0.8) !important;
                                padding: 8px !important;
                                border-radius: 8px !important;
                                position: relative !important;
                                width: 100% !important;
                                display: flex !important;
                                justify-content: center !important;
                                gap: 8px !important;
                                flex-wrap: nowrap !important;
                                box-sizing: border-box !important;
                            `;console.log('🎓 Hashrate display highlighted with yellow dashed border')}
hashrateBtc.scrollIntoView({behavior:'smooth',block:'center'})}},300)}},{id:'crypto_distribution',title:'Cryptocurrency Distribution',description:'These colored bars show your current distribution of BTC, ETH, and DOGE. As you mine more cryptocurrencies, the proportions will shift based on which miners you own!',targets:[],trigger:'manual',nextCondition:()=>!0,highlightClass:'tutorial-highlight',customHighlight:()=>{setTimeout(()=>{const btcBar=document.getElementById('btc-bar');if(btcBar){const distributionContainer=btcBar.parentElement?.parentElement?.parentElement;if(distributionContainer){distributionContainer.style.cssText=`
                                border: 3px dashed #FFD700 !important;
                                box-shadow: 0 0 30px rgba(255, 215, 0, 0.8) !important;
                                padding: 8px !important;
                                border-radius: 8px !important;
                                position: relative !important;
                                width: 100% !important;
                                display: flex !important;
                                justify-content: center !important;
                                gap: clamp(16px, 5vw, 48px) !important;
                                flex-wrap: nowrap !important;
                                box-sizing: border-box !important;
                            `;console.log('🎓 Crypto distribution display highlighted with yellow dashed border')}
btcBar.scrollIntoView({behavior:'smooth',block:'center'})}},300)}},{id:'portfolio_chart',title:'Track Your Portfolio',description:'This chart displays your total net worth over time, including your cash balance and all cryptocurrency holdings. Watch it grow as you expand your mining operation!',targets:['nw-chart-container'],trigger:'manual',nextCondition:()=>!0,highlightClass:'tutorial-highlight',customHighlight:()=>{setTimeout(()=>{const chartContainer=document.getElementById('nw-chart-container');if(chartContainer){chartContainer.style.cssText=`
                            border: 2px dashed #FFD700 !important;
                            box-shadow: 0 0 20px rgba(255, 215, 0, 0.8) !important;
                            border-radius: 6px !important;
                            position: relative !important;
                            box-sizing: border-box !important;
                        `;console.log('🎓 Portfolio chart highlighted with yellow dashed border');chartContainer.scrollIntoView({behavior:'smooth',block:'center'})}},300)}},{id:'reset_chart_button',title:'Chart Performance Tip',description:'If the game ever becomes laggy or sluggish, try clicking the red "RESET CHART" button next to the zoom controls. This clears old chart data and can significantly improve performance. It won\'t affect your game progress!',targets:['reset-chart-btn'],trigger:'manual',nextCondition:()=>!0,highlightClass:'tutorial-highlight',customHighlight:()=>{setTimeout(()=>{const resetBtn=document.getElementById('reset-chart-btn');if(resetBtn){resetBtn.style.cssText=`
                            box-shadow: 0 0 20px rgba(255, 100, 100, 0.8), inset 0 0 20px rgba(255, 100, 100, 0.3) !important;
                            background: rgba(255, 100, 100, 0.3) !important;
                            border-color: #ff6464 !important;
                            transform: scale(1.05) !important;
                            transition: all 0.3s !important;
                        `;console.log('🎓 Reset chart button highlighted');resetBtn.scrollIntoView({behavior:'smooth',block:'nearest'})}},300)}},{id:'explore_minigames',title:'Discover Minigames',description:'Click the MINIGAMES tab to unlock fun side activities! Earn extra rewards by playing Packet Interceptor, Network Destruction, and more to boost your earnings.',targets:['minigames-tab-btn'],trigger:'manual',nextCondition:()=>!0,highlightClass:'tutorial-highlight',autoAdvance:!0,customHighlight:()=>{if(window.innerWidth<=768){setTimeout(()=>{const minigamesBtn=document.getElementById('minigames-tab-btn');if(minigamesBtn){minigamesBtn.scrollIntoView({behavior:'smooth',block:'center'})}},300)}}},{id:'tutorial_complete',title:'You\'re Ready!',description:'Excellent! You\'ve learned the core mechanics. As you mine, you will see your progress towards RUGPULL filling up. Once the goal has been achieved, press the button to be prompted to sacrifice your progress and earn Corrupt Tokens—powerful upgrades that boost your earnings and apply to future playthroughs! Keep buying miners and upgrading power to grow your empire. Good luck!',targets:[],trigger:'manual',nextCondition:()=>!0,highlightClass:''}]};function isNewPlayer(){const tutorialCompleted=localStorage.getItem('tutorialCompleted')==='true';return!tutorialCompleted}
function initTutorial(){const tutorialCompleted=localStorage.getItem('tutorialCompleted')==='true';if(tutorialCompleted){console.log('🎓 Tutorial already completed, skipping');return}
console.log('🎓 Checking for in-progress tutorial...');const hasSavedState=loadTutorialState();if(!hasSavedState){console.log('🎓 Starting new tutorial');tutorialData.currentStep=0}else{console.log(`🎓 Resuming tutorial from step ${tutorialData.currentStep}`)}
showTutorialStep()}
function showTutorialStep(){const step=tutorialData.steps[tutorialData.currentStep];if(!step){completeTutorial();return}
console.log(`🎓 Tutorial Step ${tutorialData.currentStep + 1}: ${step.id}`);removeOldTutorialOverlay();const overlay=document.createElement('div');overlay.id='tutorial-overlay';const isMobile=window.innerWidth<=768;overlay.style.cssText=`
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: transparent;
        z-index: 9990;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: ${isMobile ? 'flex-end' : 'center'};
        pointer-events: none;
        ${isMobile ? 'overflow-y: auto;' : ''}
    `;const card=document.createElement('div');card.className='tutorial-card';card.style.cssText=`
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        border: 3px solid #FFD700;
        border-radius: 12px;
        padding: 30px;
        max-width: 500px;
        width: 90%;
        text-align: center;
        box-shadow: 0 0 40px rgba(255, 215, 0, 0.8), 0 0 60px rgba(0, 0, 0, 0.5);
        animation: slideIn 0.4s ease-out;
        pointer-events: auto;
        position: relative;
        z-index: 9991;
        ${isMobile ? 'margin-bottom: 15px; max-height: 45vh; overflow-y: auto;' : ''}
    `;const isStep1=step.id==='manual_hash';const isStep2=step.id==='crypto_exchange';const isStep3=step.id==='power_button';const isStep4=step.id==='buy_power_supply';const isStep6=step.id==='buy_usb_miner';let shouldDisableButton=!1;let hasMetCondition=!1;try{if(isStep1){hasMetCondition=getTotalCryptoValue()>=30;shouldDisableButton=!hasMetCondition}else if(isStep2){hasMetCondition=typeof dollarBalance!=='undefined'&&dollarBalance>=30;shouldDisableButton=!hasMetCondition}else if(isStep4){hasMetCondition=typeof powerUpgrades!=='undefined'&&powerUpgrades[0]&&powerUpgrades[0].level>0;shouldDisableButton=!hasMetCondition}else if(isStep6){hasMetCondition=typeof btcUpgrades!=='undefined'&&btcUpgrades[1]&&btcUpgrades[1].level>0;shouldDisableButton=!hasMetCondition}}catch(e){console.log('🎓 Error checking condition:',e);shouldDisableButton=!0}
const buttonStyle=shouldDisableButton?"background: rgba(100,100,100,0.3); color: #666; border: none; padding: 10px 20px; border-radius: 6px; cursor: not-allowed; font-weight: 700; opacity: 0.5;":"background: #FFD700; color: #000; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 700;";const isStep5=step.id==='btc_tab';const shouldHideButton=isStep3||isStep4||isStep5||isStep6||step.hideGotItButton;const isFinalStep=step.id==='tutorial_complete';card.innerHTML=`
        <div style="font-size: 2rem; margin-bottom: 15px;">👋</div>
        <h2 style="color: #FFD700; margin: 0 0 10px 0; font-size: 1.8rem;">${step.title}</h2>
        <p style="color: #ccc; font-size: 1rem; line-height: 1.6; margin: 15px 0;">${step.description}</p>
        <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px; flex-wrap: wrap;">
            <button onclick="skipTutorial(); location.reload();" style="background: rgba(100,100,100,0.5); color: #999; border: 2px solid #666; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 700;">Skip Tutorial</button>
            ${!shouldHideButton ? `<button id="tutorial-got-it-btn" onclick="${isFinalStep ? 'completeTutorial(); location.reload();' : 'nextTutorialStep();'} return false;" style="${buttonStyle}" ${shouldDisableButton?'disabled':''}>${isFinalStep?'Start Playing! →':'Got It! →'}</button>` : ''}
        </div>
    `;overlay.appendChild(card);document.body.appendChild(overlay);const gotItButton=document.getElementById('tutorial-got-it-btn');if(gotItButton){gotItButton.disabled=shouldDisableButton}
highlightTargets(step.targets,step.highlightClass);if(step.customHighlight&&typeof step.customHighlight==='function'){setTimeout(()=>{step.customHighlight()},50)}
if(isStep2){const exchangeBtn=document.getElementById('crypto-exchange-btn');if(exchangeBtn&&window.innerWidth<=768){setTimeout(()=>{const btnRect=exchangeBtn.getBoundingClientRect();const scrollPos=window.scrollY+btnRect.top-(window.innerHeight-btnRect.height-550);window.scrollTo({top:scrollPos,behavior:'smooth'})},600)}}else if(isStep3){const powerBtn=document.getElementById('power-upgrade-btn');if(powerBtn&&window.innerWidth<=768){setTimeout(()=>{const btnRect=powerBtn.getBoundingClientRect();const scrollPos=window.scrollY+btnRect.top-120;window.scrollTo({top:scrollPos,behavior:'smooth'});console.log('🎓 Step 3 scroll triggered - scrollPos:',scrollPos)},600)}}else if(isStep5){const btcBtn=document.getElementById('btc-tab-btn');if(btcBtn&&window.innerWidth<=768){setTimeout(()=>{const btnRect=btcBtn.getBoundingClientRect();const scrollPos=window.scrollY+btnRect.top-120;window.scrollTo({top:scrollPos,behavior:'smooth'})},600)}}else if(step.id==='hashrate_display'){setTimeout(()=>{const hashrateBtc=document.getElementById('btc-hashrate-bar');if(hashrateBtc){hashrateBtc.scrollIntoView({behavior:'smooth',block:'center'});console.log('🎓 Hashrate display step scroll triggered')}},600)}else if(step.id==='tutorial_complete'&&window.innerWidth<=768){setTimeout(()=>{window.scrollTo({top:0,behavior:'smooth'});console.log('🎓 Step 7 scroll to top triggered')},600)}}
function highlightTargets(targets,highlightClass){targets.forEach(targetId=>{const element=document.getElementById(targetId);if(element){element.classList.add('tutorial-highlight');element.style.boxShadow='0 0 30px rgba(255, 215, 0, 0.8), inset 0 0 30px rgba(255, 215, 0, 0.2)';element.style.zIndex='9991';if(targetId==='reset-chart-btn'){element.style.color='#ff6464 !important'}}})}
function removeOldTutorialOverlay(){const oldOverlay=document.getElementById('tutorial-overlay');if(oldOverlay)oldOverlay.remove();const step=tutorialData.steps[tutorialData.currentStep];const isCurrentStepPowerSupply=step&&step.id==='buy_power_supply';const isCurrentStepUSBMiner=step&&step.id==='buy_usb_miner';document.querySelectorAll('.tutorial-highlight').forEach(el=>{el.classList.remove('tutorial-highlight');el.style.boxShadow='';el.style.zIndex=''});document.querySelectorAll('button').forEach(btn=>{if(btn.textContent.includes('SELL ALL')){btn.style.animation='';btn.style.boxShadow='';btn.style.zIndex=''}});['bal-btc','bal-eth','bal-doge'].forEach(id=>{const el=document.getElementById(id);if(el){el.style.boxShadow=''}});if(!isCurrentStepPowerSupply){const basicPowerStripBtn=document.getElementById('pow-0');if(basicPowerStripBtn){basicPowerStripBtn.style.boxShadow='';basicPowerStripBtn.style.border='';basicPowerStripBtn.style.zIndex='';basicPowerStripBtn.style.borderRadius='';basicPowerStripBtn.style.outline='';basicPowerStripBtn.style.outlineOffset='';basicPowerStripBtn.style.position=''}}
if(!isCurrentStepUSBMiner){const usbMinerBtn=document.getElementById('up-1');if(usbMinerBtn){usbMinerBtn.style.boxShadow='';usbMinerBtn.style.border='';usbMinerBtn.style.zIndex='';usbMinerBtn.style.borderRadius='';usbMinerBtn.style.outline='';usbMinerBtn.style.outlineOffset='';usbMinerBtn.style.position=''}}
const isCurrentStepGPURig=step&&step.id==='buy_gpu_rig';if(!isCurrentStepGPURig){const possibleSelectors=['up-1-eth','ue-1','eth-upgrade-1'];possibleSelectors.forEach(selector=>{const gpuRigBtn=document.getElementById(selector);if(gpuRigBtn){gpuRigBtn.style.cssText='';gpuRigBtn.removeAttribute('style')}});document.querySelectorAll('button.u-item').forEach(btn=>{if(btn.textContent.includes('Single GPU Rig')){btn.style.cssText='';btn.removeAttribute('style')}})}
const isCurrentStepScryptMiner=step&&step.id==='buy_scrypt_miner';if(!isCurrentStepScryptMiner){const possibleSelectors=['up-1-doge','ud-1','doge-upgrade-1'];possibleSelectors.forEach(selector=>{const scryptBtn=document.getElementById(selector);if(scryptBtn){scryptBtn.style.cssText='';scryptBtn.removeAttribute('style')}});document.querySelectorAll('button.u-item').forEach(btn=>{if(btn.textContent.includes('Basic Scrypt Miner')){btn.style.cssText='';btn.removeAttribute('style')}})}
const isCurrentStepHashrate=step&&step.id==='hashrate_display';if(!isCurrentStepHashrate){const hashrateBtc=document.getElementById('btc-hashrate-bar');if(hashrateBtc){const hashrateContainer=hashrateBtc.parentElement?.parentElement?.parentElement;if(hashrateContainer){hashrateContainer.style.border='';hashrateContainer.style.boxShadow='';hashrateContainer.style.padding='';hashrateContainer.style.borderRadius='';hashrateContainer.style.position=''}}}
const isCurrentStepDistribution=step&&step.id==='crypto_distribution';if(!isCurrentStepDistribution){const btcBar=document.getElementById('btc-bar');if(btcBar){const distributionContainer=btcBar.parentElement?.parentElement?.parentElement;if(distributionContainer){distributionContainer.style.border='';distributionContainer.style.boxShadow='';distributionContainer.style.padding='';distributionContainer.style.borderRadius='';distributionContainer.style.position=''}}}
const isCurrentStepChart=step&&step.id==='portfolio_chart';if(!isCurrentStepChart){const chartContainer=document.getElementById('nw-chart-container');if(chartContainer){chartContainer.style.border='';chartContainer.style.boxShadow='';chartContainer.style.borderRadius='';chartContainer.style.position=''}}
const isCurrentStepResetChart=step&&step.id==='reset_chart_button';if(!isCurrentStepResetChart){const resetBtn=document.getElementById('reset-chart-btn');if(resetBtn){resetBtn.style.boxShadow='';resetBtn.style.background='';resetBtn.style.borderColor='';resetBtn.style.transform='';resetBtn.style.transition=''}}}
function nextTutorialStep(){console.log('🎓 nextTutorialStep() called');const step=tutorialData.steps[tutorialData.currentStep];if(!step){console.log('🎓 No step found, tutorial might be complete');return}
console.log(`🎓 Current step: ${step.id}, trigger: ${step.trigger}`);console.log(`🎓 Advancing from step ${step.id} (button clicked)`);tutorialData.currentStep++;saveTutorialState();showTutorialStep()}
function skipTutorial(){removeOldTutorialOverlay();tutorialData.completed=!0;localStorage.setItem('tutorialCompleted','true');localStorage.removeItem('tutorialState');console.log('🎓 Tutorial skipped')}
function completeTutorial(){removeOldTutorialOverlay();tutorialData.completed=!0;localStorage.setItem('tutorialCompleted','true');localStorage.removeItem('tutorialState');console.log('🎓 Tutorial completed!')}
function checkTutorialProgress(){if(tutorialData.completed)return;const step=tutorialData.steps[tutorialData.currentStep];if(!step)return;if(step.id==='manual_hash'){const totalCryptoValue=getTotalCryptoValue();const gotItButton=document.getElementById('tutorial-got-it-btn');const hasEarned30=totalCryptoValue>=30;if(gotItButton){if(hasEarned30){console.log('🎓 ENABLING Got It button - earned $30! Setting disabled=false and adding glow.');gotItButton.disabled=!1;gotItButton.removeAttribute('disabled');gotItButton.setAttribute('style','background: #FFD700 !important; color: #000 !important; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer !important; font-weight: 700; opacity: 1 !important; pointer-events: auto !important; box-shadow: 0 0 20px rgba(255, 215, 0, 0.9), inset 0 0 10px rgba(255, 215, 0, 0.3) !important;');console.log(`🎓 Button now disabled: ${gotItButton.disabled}, background: ${gotItButton.style.background}`)}else{gotItButton.disabled=!0;gotItButton.setAttribute('disabled','disabled');gotItButton.setAttribute('style','background: rgba(100,100,100,0.3); color: #666; border: none; padding: 10px 20px; border-radius: 6px; cursor: not-allowed; font-weight: 700; opacity: 0.5;')}}}else if(step.id==='crypto_exchange'){const gotItButton=document.getElementById('tutorial-got-it-btn');const hasCash30Plus=typeof dollarBalance!=='undefined'&&dollarBalance>=30;console.log(`🎓 Step 2 button check: dollarBalance=${dollarBalance}, hasCash30Plus=${hasCash30Plus}, button exists=${!!gotItButton}`);if(gotItButton){if(hasCash30Plus){console.log('🎓 ENABLING Got It button - earned $30 cash! Setting disabled=false and adding glow.');gotItButton.disabled=!1;gotItButton.removeAttribute('disabled');gotItButton.setAttribute('style','background: #FFD700 !important; color: #000 !important; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer !important; font-weight: 700; opacity: 1 !important; pointer-events: auto !important; box-shadow: 0 0 20px rgba(255, 215, 0, 0.9), inset 0 0 10px rgba(255, 215, 0, 0.3) !important;')}else{console.log('🎓 Step 2: Not enough cash yet. Button greyed out and disabled.');gotItButton.disabled=!0;gotItButton.setAttribute('disabled','disabled');gotItButton.setAttribute('style','background: rgba(100,100,100,0.3); color: #666; border: none; padding: 10px 20px; border-radius: 6px; cursor: not-allowed; font-weight: 700; opacity: 0.5;')}}}else if(step.id==='buy_power_supply'){const gotItButton=document.getElementById('tutorial-got-it-btn');const hasPowerUpgrade=typeof powerUpgrades!=='undefined'&&powerUpgrades[0]&&powerUpgrades[0].level>0;console.log(`🎓 Step 4 button check: powerUpgrades[0].level=${powerUpgrades[0] ? powerUpgrades[0].level : 'undefined'}, hasPowerUpgrade=${hasPowerUpgrade}, button exists=${!!gotItButton}`);if(gotItButton){if(hasPowerUpgrade){console.log('🎓 ENABLING Got It button - bought Basic Power Strip! Setting disabled=false and adding glow.');gotItButton.disabled=!1;gotItButton.removeAttribute('disabled');gotItButton.setAttribute('style','background: #FFD700 !important; color: #000 !important; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer !important; font-weight: 700; opacity: 1 !important; pointer-events: auto !important; box-shadow: 0 0 20px rgba(255, 215, 0, 0.9), inset 0 0 10px rgba(255, 215, 0, 0.3) !important;')}else{console.log('🎓 Step 4: Basic Power Strip not purchased yet. Button greyed out and disabled.');gotItButton.disabled=!0;gotItButton.setAttribute('disabled','disabled');gotItButton.setAttribute('style','background: rgba(100,100,100,0.3); color: #666; border: none; padding: 10px 20px; border-radius: 6px; cursor: not-allowed; font-weight: 700; opacity: 0.5;')}}}else if(step.id==='buy_usb_miner'){const gotItButton=document.getElementById('tutorial-got-it-btn');const hasUSBMiner=typeof btcUpgrades!=='undefined'&&btcUpgrades[1]&&btcUpgrades[1].level>0;console.log(`🎓 Step 6 button check: btcUpgrades[1].level=${btcUpgrades[1] ? btcUpgrades[1].level : 'undefined'}, hasUSBMiner=${hasUSBMiner}, button exists=${!!gotItButton}`);if(gotItButton){if(hasUSBMiner){console.log('🎓 ENABLING Got It button - bought USB Miner! Setting disabled=false and adding glow.');gotItButton.disabled=!1;gotItButton.removeAttribute('disabled');gotItButton.setAttribute('style','background: #FFD700 !important; color: #000 !important; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer !important; font-weight: 700; opacity: 1 !important; pointer-events: auto !important; box-shadow: 0 0 20px rgba(255, 215, 0, 0.9), inset 0 0 10px rgba(255, 215, 0, 0.3) !important;')}else{console.log('🎓 Step 6: USB Miner not purchased yet. Button greyed out and disabled.');gotItButton.disabled=!0;gotItButton.setAttribute('disabled','disabled');gotItButton.setAttribute('style','background: rgba(100,100,100,0.3); color: #666; border: none; padding: 10px 20px; border-radius: 6px; cursor: not-allowed; font-weight: 700; opacity: 0.5;')}}}else if(step.id==='buy_eth_miner'){if(tutorialData.ethTabClicked){console.log('🎓 Step 7: ETH tab clicked! Auto-advancing.');nextTutorialStep()}}else if(step.id==='buy_gpu_rig'){const hasGPURig=typeof ethUpgrades!=='undefined'&&ethUpgrades[1]&&ethUpgrades[1].level>0;if(hasGPURig){console.log('🎓 Step 8: Single GPU Rig purchased! Auto-advancing.');nextTutorialStep()}}else if(step.id==='buy_doge_miner'){if(tutorialData.dogeTabClicked){console.log('🎓 Step 9: DOGE tab clicked! Auto-advancing.');nextTutorialStep()}}else if(step.id==='buy_scrypt_miner'){const hasScryptMiner=typeof dogeUpgrades!=='undefined'&&dogeUpgrades[1]&&dogeUpgrades[1].level>0;if(hasScryptMiner){console.log('🎓 Step 10: Basic Scrypt Miner purchased! Auto-advancing.');nextTutorialStep()}}}
let manualHashClicks=0;function trackManualHashClick(){manualHashClicks++;if(manualHashClicks>=3){tutorialData.hashClicksDone=!0}}
function trackPowerUpgradeClick(){tutorialData.powerUpgradeClicked=!0;saveTutorialState();if(!tutorialData.completed&&tutorialData.currentStep===2&&tutorialData.steps[2].id==='power_button'){console.log('🎓 Power upgrade button clicked! Advancing tutorial.');nextTutorialStep()}}
function trackPowerStripPurchase(){if(!tutorialData.completed&&tutorialData.currentStep===3&&tutorialData.steps[3].id==='buy_power_supply'){console.log('🎓 Basic Power Strip purchased! Advancing tutorial.');nextTutorialStep()}}
function trackBTCTabClick(){tutorialData.btcTabClicked=!0;saveTutorialState();if(!tutorialData.completed&&tutorialData.currentStep===4&&tutorialData.steps[4].id==='btc_tab'){console.log('🎓 BTC tab clicked! Advancing tutorial.');nextTutorialStep()}}
function trackETHTabClick(){tutorialData.ethTabClicked=!0;saveTutorialState();if(!tutorialData.completed&&tutorialData.currentStep===6&&tutorialData.steps[6].id==='buy_eth_miner'){console.log('🎓 ETH tab clicked! Advancing tutorial.');nextTutorialStep()}}
function trackDOGETabClick(){tutorialData.dogeTabClicked=!0;saveTutorialState();if(!tutorialData.completed&&tutorialData.currentStep===8&&tutorialData.steps[8].id==='buy_doge_miner'){console.log('🎓 DOGE tab clicked! Advancing tutorial.');nextTutorialStep()}}
function trackMinigamesTabClick(){if(!tutorialData.completed&&tutorialData.currentStep===14&&tutorialData.steps[14].id==='explore_minigames'){console.log('🎓 Minigames tab clicked! Auto-advancing tutorial.');nextTutorialStep()}}
function trackUSBMinerPurchase(){if(!tutorialData.completed&&tutorialData.currentStep===5&&tutorialData.steps[5].id==='buy_usb_miner'){console.log('🎓 USB Miner purchased! Advancing tutorial.');nextTutorialStep()}}
function trackGPURigPurchase(){if(!tutorialData.completed&&tutorialData.currentStep===7&&tutorialData.steps[7].id==='buy_gpu_rig'){console.log('🎓 Single GPU Rig purchased! Advancing tutorial.');const possibleSelectors=['up-1-eth','ue-1','eth-upgrade-1'];possibleSelectors.forEach(selector=>{const gpuRigBtn=document.getElementById(selector);if(gpuRigBtn){gpuRigBtn.style.cssText='';gpuRigBtn.removeAttribute('style')}});document.querySelectorAll('button.u-item').forEach(btn=>{if(btn.textContent.includes('Single GPU Rig')){btn.style.cssText='';btn.removeAttribute('style')}});nextTutorialStep()}}
function trackScryptMinerPurchase(){if(!tutorialData.completed&&tutorialData.currentStep===9&&tutorialData.steps[9].id==='buy_scrypt_miner'){console.log('🎓 Basic Scrypt Miner purchased! Advancing tutorial.');const possibleSelectors=['up-1-doge','ud-1','doge-upgrade-1'];possibleSelectors.forEach(selector=>{const scryptBtn=document.getElementById(selector);if(scryptBtn){scryptBtn.style.cssText='';scryptBtn.removeAttribute('style')}});document.querySelectorAll('button.u-item').forEach(btn=>{if(btn.textContent.includes('Basic Scrypt Miner')){btn.style.cssText='';btn.removeAttribute('style')}});nextTutorialStep()}}
const tutorialStyles=`
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: scale(0.9) translateY(-30px);
        }
        to {
            opacity: 1;
            transform: scale(1) translateY(0);
        }
    }

    .tutorial-highlight {
        position: relative;
        transition: all 0.3s ease;
    }

    .tutorial-highlight::before {
        content: '';
        position: absolute;
        top: -5px;
        left: -5px;
        right: -5px;
        bottom: -5px;
        border: 2px dashed #FFD700;
        border-radius: 8px;
        animation: pulse 1s infinite;
        pointer-events: none;
    }

    @keyframes pulse {
        0%, 100% {
            box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7);
        }
        50% {
            box-shadow: 0 0 0 10px rgba(255, 215, 0, 0);
        }
    }

    .tutorial-highlight-urgent {
        animation: wiggle 0.5s infinite;
    }

    @keyframes wiggle {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(-2deg); }
        75% { transform: rotate(2deg); }
    }

    @keyframes tutorial-flash {
        0%, 100% {
            box-shadow: 0 0 10px rgba(255, 215, 0, 0.4);
        }
        50% {
            box-shadow: 0 0 30px rgba(255, 215, 0, 1);
        }
    }


    /* Mobile responsive styles */
    @media (max-width: 768px) {
        .tutorial-card {
            max-width: 90vw !important;
            padding: 20px !important;
        }

        .tutorial-card h2 {
            font-size: 1.4rem !important;
        }

        .tutorial-card p {
            font-size: 0.9rem !important;
            line-height: 1.4 !important;
        }

        .tutorial-card button {
            font-size: 0.85rem !important;
            padding: 8px 15px !important;
        }

        .tutorial-card > div:first-child {
            font-size: 1.5rem !important;
        }
    }

    @media (max-width: 480px) {
        .tutorial-card {
            max-width: 95vw !important;
            padding: 15px !important;
        }

        .tutorial-card h2 {
            font-size: 1.2rem !important;
        }

        .tutorial-card p {
            font-size: 0.85rem !important;
            margin: 10px 0 !important;
        }

        .tutorial-card button {
            font-size: 0.75rem !important;
            padding: 6px 12px !important;
            flex: 1;
        }

        .tutorial-card > div:first-child {
            font-size: 1.2rem !important;
            margin-bottom: 10px !important;
        }

        .tutorial-card > div:last-child {
            font-size: 0.7rem !important;
            margin-top: 10px !important;
        }
    }
`;const styleSheet=document.createElement('style');styleSheet.textContent=tutorialStyles;document.head.appendChild(styleSheet)
