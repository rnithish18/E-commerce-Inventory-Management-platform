import React from 'react';

interface Credit {
  photographer: string;
  profileUrl: string;
  photoId: string;
  photoUrl: string;
  usedFor: string;
}

const CREDITS: Credit[] = [
  { photographer: 'Jonas Leupe', profileUrl: 'https://www.pexels.com/@jonasleupe', photoId: '267394', photoUrl: 'https://www.pexels.com/photo/267394', usedFor: 'Smartwatch product images' },
  { photographer: 'Lukas', profileUrl: 'https://www.pexels.com/@goumbik', photoId: '3394650', photoUrl: 'https://www.pexels.com/photo/3394650', usedFor: 'Headphone product images' },
  { photographer: 'Tyler Lastovich', profileUrl: 'https://www.pexels.com/@lastly', photoId: '788946', photoUrl: 'https://www.pexels.com/photo/788946', usedFor: 'Smartphone product images' },
  { photographer: 'Matan Segev', profileUrl: 'https://www.pexels.com/@matansegev', photoId: '404280', photoUrl: 'https://www.pexels.com/photo/404280', usedFor: 'Mobile phone product images' },
  { photographer: 'Skitterphoto', profileUrl: 'https://www.pexels.com/@skitterphoto', photoId: '1649771', photoUrl: 'https://www.pexels.com/photo/1649771', usedFor: 'Over-ear headphones' },
  { photographer: 'William Fortunato', profileUrl: 'https://www.pexels.com/@william-fortunato', photoId: '3780681', photoUrl: 'https://www.pexels.com/photo/3780681', usedFor: 'TWS earbuds' },
  { photographer: 'Negative Space', profileUrl: 'https://www.pexels.com/@negativespace', photoId: '18105', photoUrl: 'https://www.pexels.com/photo/18105', usedFor: 'Laptop computer' },
  { photographer: 'Skitterphoto', profileUrl: 'https://www.pexels.com/@skitterphoto', photoId: '51383', photoUrl: 'https://www.pexels.com/photo/51383', usedFor: 'Camera product images' },
  { photographer: 'Milly Eaton', profileUrl: 'https://www.pexels.com/@millyeaton', photoId: '2115257', photoUrl: 'https://www.pexels.com/photo/2115257', usedFor: 'Computer mouse, keyboard' },
  { photographer: 'David Bartus', profileUrl: 'https://www.pexels.com/@davidbartus', photoId: '1706694', photoUrl: 'https://www.pexels.com/photo/1706694', usedFor: 'Portable speakers' },
  { photographer: 'Eva Elijas', profileUrl: 'https://www.pexels.com/@eva-elijas', photoId: '1092644', photoUrl: 'https://www.pexels.com/photo/1092644', usedFor: 'Smartphone product' },
  { photographer: 'Porapak Apichodilok', profileUrl: 'https://www.pexels.com/@nurseryart', photoId: '777001', photoUrl: 'https://www.pexels.com/photo/777001', usedFor: 'Desktop monitor' },
  { photographer: 'Jordan Bergendahl', profileUrl: 'https://www.pexels.com/@jordanbergendahl', photoId: '2529148', photoUrl: 'https://www.pexels.com/photo/2529148', usedFor: 'Sneakers, sports shoes' },
  { photographer: 'John Vino', profileUrl: 'https://www.pexels.com/@jovynt', photoId: '1598507', photoUrl: 'https://www.pexels.com/photo/1598507', usedFor: 'Jeans, trousers' },
  { photographer: 'Anastasia Shuraeva', profileUrl: 'https://www.pexels.com/@anastasia-shuraeva', photoId: '8532616', photoUrl: 'https://www.pexels.com/photo/8532616', usedFor: 'Sportswear, track jacket' },
  { photographer: 'Christian Wiediger', profileUrl: 'https://www.pexels.com/@christianw', photoId: '297933', photoUrl: 'https://www.pexels.com/photo/297933', usedFor: 'Formal shirts, polo t-shirts' },
  { photographer: 'Becerra Govea Photo', profileUrl: 'https://www.pexels.com/@becerra-govea-photo', photoId: '985635', photoUrl: 'https://www.pexels.com/photo/985635', usedFor: 'Women\'s dresses, kurtis' },
  { photographer: 'Mikes Photos', profileUrl: 'https://www.pexels.com/@mikebirdy', photoId: '267301', photoUrl: 'https://www.pexels.com/photo/267301', usedFor: 'Shoes, boots, sandals' },
  { photographer: 'rawpixel.com', profileUrl: 'https://www.pexels.com/@rawpixel', photoId: '1152077', photoUrl: 'https://www.pexels.com/photo/1152077', usedFor: 'Bags, backpacks, accessories' },
  { photographer: 'Lukas', profileUrl: 'https://www.pexels.com/@goumbik', photoId: '1032110', photoUrl: 'https://www.pexels.com/photo/1032110', usedFor: 'Running shoes, sports footwear' },
  { photographer: 'Trung Nguyen', profileUrl: 'https://www.pexels.com/@trung-nguyen-204285', photoId: '190819', photoUrl: 'https://www.pexels.com/photo/190819', usedFor: 'Watches' },
  { photographer: 'Polina Kovaleva', profileUrl: 'https://www.pexels.com/@polina-kovaleva', photoId: '9558574', photoUrl: 'https://www.pexels.com/photo/9558574', usedFor: 'Indian ethnic wear, kurtis' },
  { photographer: 'Engin Akyurt', profileUrl: 'https://www.pexels.com/@enginakyurt', photoId: '4397912', photoUrl: 'https://www.pexels.com/photo/4397912', usedFor: 'Kitchen appliances, cookware' },
  { photographer: 'Jonathan Borba', profileUrl: 'https://www.pexels.com/@jonathanborba', photoId: '1346347', photoUrl: 'https://www.pexels.com/photo/1346347', usedFor: 'Bottles, flasks, beverages' },
  { photographer: 'Jaymantri', profileUrl: 'https://www.pexels.com/@jaymantri', photoId: '1648768', photoUrl: 'https://www.pexels.com/photo/1648768', usedFor: 'Bedsheets, home textiles' },
  { photographer: 'Vecislavas Popa', profileUrl: 'https://www.pexels.com/@vecislavas-popa', photoId: '1457847', photoUrl: 'https://www.pexels.com/photo/1457847', usedFor: 'Home decor, bathroom accessories' },
  { photographer: 'Pok Rie', profileUrl: 'https://www.pexels.com/@pok-rie-33563', photoId: '1148955', photoUrl: 'https://www.pexels.com/photo/1148955', usedFor: 'Furniture, chairs, home items' },
  { photographer: 'Polina Tankilevitch', profileUrl: 'https://www.pexels.com/@polina-tankilevitch', photoId: '2113855', photoUrl: 'https://www.pexels.com/photo/2113855', usedFor: 'Cosmetics, makeup' },
  { photographer: 'Shiny Diamond', profileUrl: 'https://www.pexels.com/@shiny-diamond', photoId: '3737593', photoUrl: 'https://www.pexels.com/photo/3737593', usedFor: 'Skincare, haircare products' },
  { photographer: 'Ron Lach', profileUrl: 'https://www.pexels.com/@ron-lach', photoId: '3998429', photoUrl: 'https://www.pexels.com/photo/3998429', usedFor: 'Grooming products, razors' },
  { photographer: 'Pixabay', profileUrl: 'https://www.pexels.com/@pixabay', photoId: '46798', photoUrl: 'https://www.pexels.com/photo/46798', usedFor: 'Sports equipment, football' },
  { photographer: 'Wendy Wei', profileUrl: 'https://www.pexels.com/@wendywei', photoId: '3660204', photoUrl: 'https://www.pexels.com/photo/3660204', usedFor: 'Racket sports, cricket, badminton' },
  { photographer: 'Elly Fairytale', profileUrl: 'https://www.pexels.com/@elly-fairytale', photoId: '4056723', photoUrl: 'https://www.pexels.com/photo/4056723', usedFor: 'Yoga, fitness accessories' },
  { photographer: 'Leon Ardho', profileUrl: 'https://www.pexels.com/@leonardho', photoId: '841130', photoUrl: 'https://www.pexels.com/photo/841130', usedFor: 'Gym equipment, weights' },
  { photographer: 'Sagui Andrea', profileUrl: 'https://www.pexels.com/@sagui-andrea', photoId: '417173', photoUrl: 'https://www.pexels.com/photo/417173', usedFor: 'Outdoor sports, hiking' },
  { photographer: 'Pixabay', profileUrl: 'https://www.pexels.com/@pixabay', photoId: '256450', photoUrl: 'https://www.pexels.com/photo/256450', usedFor: 'Books, stationery' },
  { photographer: 'Suzy Hazelwood', profileUrl: 'https://www.pexels.com/@suzyhazelwood', photoId: '159711', photoUrl: 'https://www.pexels.com/photo/159711', usedFor: 'Notebooks, pens, stationery items' },
  { photographer: 'Polesie Toys', profileUrl: 'https://www.pexels.com/@polesie-toys-6218261', photoId: '298825', photoUrl: 'https://www.pexels.com/photo/298825', usedFor: 'Toys, games, LEGO' },
  { photographer: 'Skitterphoto', profileUrl: 'https://www.pexels.com/@skitterphoto', photoId: '278918', photoUrl: 'https://www.pexels.com/photo/278918', usedFor: 'Board games, card games' },
  { photographer: 'ThisIsEngineering', profileUrl: 'https://www.pexels.com/@thisisengineering', photoId: '2881229', photoUrl: 'https://www.pexels.com/photo/2881229', usedFor: 'Networking hardware, router' },
  { photographer: 'Jordan Bergendahl', profileUrl: 'https://www.pexels.com/@jordanbergendahl', photoId: '4792728', photoUrl: 'https://www.pexels.com/photo/4792728', usedFor: 'Storage devices, hard drive' },
  { photographer: 'Anete Lusina', profileUrl: 'https://www.pexels.com/@anete-lusina', photoId: '4219830', photoUrl: 'https://www.pexels.com/photo/4219830', usedFor: 'Chargers, cables, accessories' },
  { photographer: 'Perfecto Capucine', profileUrl: 'https://www.pexels.com/@perfecto-capucine', photoId: '904616', photoUrl: 'https://www.pexels.com/photo/904616', usedFor: 'E-reader, tablet' },
  { photographer: 'Sony Stark', profileUrl: 'https://www.pexels.com/@sony-stark', photoId: '9072218', photoUrl: 'https://www.pexels.com/photo/9072218', usedFor: 'Gaming controllers' },
];

export function ImageCreditsPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Image Credits &amp; Licences</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
        ShopNest is a demonstration e-commerce store. Product images are sourced from{' '}
        <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          Pexels
        </a>{' '}
        and are used under the{' '}
        <a href="https://www.pexels.com/license/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          Pexels License
        </a>
        . All images are free for commercial and personal use. Attribution is not required by the licence, but we provide it
        here as a courtesy to the photographers.
      </p>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-card p-4 mb-6 text-xs text-amber-800 dark:text-amber-300">
        <strong>Disclaimer:</strong> Product names, brands, and prices on this site are for demonstration purposes only.
        Real products may differ. This is not a real commercial store.
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-neutral-50 dark:bg-navy-800 border-b border-surface-border dark:border-white/10">
              <th className="text-left px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300">Photographer</th>
              <th className="text-left px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300 hidden sm:table-cell">Photo</th>
              <th className="text-left px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300">Used for</th>
            </tr>
          </thead>
          <tbody>
            {CREDITS.map((c, i) => (
              <tr
                key={c.photoId}
                className={`border-b border-surface-border dark:border-white/10 last:border-0 ${
                  i % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-neutral-50/50 dark:bg-navy-900/30'
                }`}
              >
                <td className="px-4 py-2.5">
                  <a
                    href={c.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    {c.photographer}
                  </a>
                </td>
                <td className="px-4 py-2.5 hidden sm:table-cell">
                  <a
                    href={c.photoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-mono"
                  >
                    #{c.photoId}
                  </a>
                </td>
                <td className="px-4 py-2.5 text-neutral-600 dark:text-neutral-400">{c.usedFor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-neutral-400 dark:text-neutral-500">
        {CREDITS.length} photographers credited · Last updated {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}
      </p>
    </div>
  );
}
