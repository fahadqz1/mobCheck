// Insert-only: adds standard inspection checklist items that are missing. Existing rows are never modified.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const common = (lock) => [
  ['Battery & charging', 3, [
    ['Battery health / capacity', 'Read maximum capacity in settings or a diagnostic app.'],
    ['Wired charging', 'Charge with a known-good cable for 2 minutes and confirm it charges.'],
    ['Wireless charging (if supported)', 'Place on a wireless charger and confirm it charges.'],
  ]],
  ['Cameras', 4, [
    ['Rear cameras', 'Take a photo with every rear lens and check focus and spots.'],
    ['Front camera', 'Take a photo and record a short video.'],
    ['Flash / torch', 'Turn on the torch.'],
  ]],
  ['Audio & calls', 5, [
    ['Earpiece', 'Place a test call and listen through the earpiece.'],
    ['Loudspeaker', 'Play audio at full volume and listen for distortion.'],
    ['Microphones', 'Record a voice memo and play it back.'],
  ]],
  ['Connectivity', 6, [
    ['SIM / network', 'Insert a SIM and confirm signal and mobile data.'],
    ['Wi-Fi', 'Connect to Wi-Fi and load a web page.'],
    ['Bluetooth', 'Pair with another device.'],
    ['GPS', 'Open maps and confirm the location is found.'],
  ]],
  ['Sensors & buttons', 7, [
    ['Biometrics', 'Enrol and unlock with Face ID / fingerprint.'],
    ['Proximity sensor', 'During a call, cover the top of the screen; it should turn off.'],
    ['Vibration motor', 'Trigger a vibration.'],
  ]],
  ['Identity & security', 8, [
    ['IMEI matches device and box', 'Dial *#06# and compare with the settings page and box.'],
    ['PTA status checked', 'Check the IMEI on DIRBS / PTA and record the result.'],
    [lock, 'Confirm the seller has signed out and the lock is off.'],
    ['Signs of prior repair', 'Look for non-original parts messages, screw damage or replaced screens.'],
  ]],
];

const lists = {
  IPHONE: [
    ['Physical Condition', 1, [['Front Glass'], ['Back Glass'], ['Frame'], ['SIM Tray'], ['Buttons & Switches'], ['Charging Port']]],
    ['Display', 2, [['Display Functionality'], ['Touch Responsiveness'], ['Dead Pixels'], ['Brightness'], ['OLED Burn-in']]],
    ...common('iCloud / Find My iPhone off'),
  ],
  ANDROID: [
    ['Physical Condition', 1, [['Front Glass'], ['Back Panel'], ['Frame'], ['SIM Tray'], ['Buttons'], ['Charging Port']]],
    ['Display', 2, [['Display Functionality'], ['Touch Responsiveness'], ['Dead Pixels'], ['Brightness'], ['Screen burn-in']]],
    ...common('Google account (FRP) removed'),
  ],
};

let created = 0;
for (const [deviceType, categories] of Object.entries(lists)) {
  for (const [category, categorySequence, checks] of categories) {
    for (const [i, [checkName, instructions]] of checks.entries()) {
      const where = { deviceType_category_checkSequence: { deviceType, category, checkSequence: i + 1 } };
      if (await prisma.inspectionChecklist.findUnique({ where })) continue;
      await prisma.inspectionChecklist.create({
        data: {
          deviceType,
          category,
          categorySequence,
          checkName,
          checkSequence: i + 1,
          description: `Check ${checkName.toLowerCase()}`,
          testInstructions: instructions || `Inspect ${checkName.toLowerCase()} for damage or faults.`,
        },
      });
      created++;
    }
  }
}
console.log(`Checklist items added: ${created}`);
await prisma.$disconnect();
