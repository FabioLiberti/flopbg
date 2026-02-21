<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 30px; line-height: 1.8; color: #2c3e50; background-color: #f8f9fa; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">

   <h1 style="color: #2c3e50; font-size: 28px; margin-bottom: 25px; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
       Dataset Generici
   </h1>
   <p style="font-size: 16px; margin-bottom: 25px;">
       Dataset standard utilizzati nella comunità scientifica per il benchmarking e la validazione di modelli di machine learning.
   </p>

   <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
       <h2 style="color: #3498db; font-size: 22px; margin-bottom: 15px;">MNIST</h2>
       <p style="font-size: 16px; margin-bottom: 15px;">
           Database di riferimento per il riconoscimento di cifre scritte a mano.
       </p>
       <ul style="list-style-type: none; padding-left: 0;">
           <li style="margin-bottom: 8px;">• <strong>Dimensione:</strong> 70.000 immagini (60.000 training + 10.000 test)</li>
           <li style="margin-bottom: 8px;">• <strong>Formato immagini:</strong> 28x28 pixel, scala di grigi</li>
           <li style="margin-bottom: 8px;">• <strong>Classi:</strong> 10 (cifre da 0 a 9)</li>
           <li style="margin-bottom: 8px;">• <strong>Formato dati:</strong> Numpy array</li>
           <li style="margin-bottom: 8px;">• <strong>Dimensione file:</strong> ~11 MB compressi</li>
           <li>• <strong>Origine:</strong> Yann LeCun, Corinna Cortes, Christopher J.C. Burges</li>
       </ul>
   </div>

   <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
       <h2 style="color: #3498db; font-size: 22px; margin-bottom: 15px;">Fashion MNIST</h2>
       <p style="font-size: 16px; margin-bottom: 15px;">
           Dataset di immagini di capi d'abbigliamento, strutturalmente simile a MNIST.
       </p>
       <ul style="list-style-type: none; padding-left: 0;">
           <li style="margin-bottom: 8px;">• <strong>Dimensione:</strong> 70.000 immagini (60.000 training + 10.000 test)</li>
           <li style="margin-bottom: 8px;">• <strong>Formato immagini:</strong> 28x28 pixel, scala di grigi</li>
           <li style="margin-bottom: 8px;">• <strong>Classi:</strong> 10 (T-shirt, pantaloni, pullover, vestiti, ecc.)</li>
           <li style="margin-bottom: 8px;">• <strong>Formato dati:</strong> Numpy array</li>
           <li style="margin-bottom: 8px;">• <strong>Dimensione file:</strong> ~30 MB compressi</li>
           <li>• <strong>Origine:</strong> Zalando Research</li>
       </ul>
   </div>

   <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
       <h2 style="color: #3498db; font-size: 22px; margin-bottom: 15px;">CIFAR 10</h2>
       <p style="font-size: 16px; margin-bottom: 15px;">
           Collezione di immagini a colori per classificazione di oggetti comuni.
       </p>
       <ul style="list-style-type: none; padding-left: 0;">
           <li style="margin-bottom: 8px;">• <strong>Dimensione:</strong> 60.000 immagini (50.000 training + 10.000 test)</li>
           <li style="margin-bottom: 8px;">• <strong>Formato immagini:</strong> 32x32 pixel, RGB</li>
           <li style="margin-bottom: 8px;">• <strong>Classi:</strong> 10 (aereo, automobile, uccello, gatto, cervo, cane, rana, cavallo, nave, camion)</li>
           <li style="margin-bottom: 8px;">• <strong>Formato dati:</strong> Numpy array</li>
           <li style="margin-bottom: 8px;">• <strong>Dimensione file:</strong> ~170 MB compressi</li>
           <li>• <strong>Origine:</strong> Alex Krizhevsky, Vinod Nair, Geoffrey Hinton</li>
       </ul>
   </div>

   <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
       <h2 style="color: #3498db; font-size: 22px; margin-bottom: 15px;">CIFAR 100</h2>
       <p style="font-size: 16px; margin-bottom: 15px;">
           Estensione del CIFAR-10 con categorie più granulari.
       </p>
       <ul style="list-style-type: none; padding-left: 0;">
           <li style="margin-bottom: 8px;">• <strong>Dimensione:</strong> 60.000 immagini (50.000 training + 10.000 test)</li>
           <li style="margin-bottom: 8px;">• <strong>Formato immagini:</strong> 32x32 pixel, RGB</li>
           <li style="margin-bottom: 8px;">• <strong>Classi:</strong> 100 suddivise in 20 supercategorie</li>
           <li style="margin-bottom: 8px;">• <strong>Formato dati:</strong> Numpy array</li>
           <li style="margin-bottom: 8px;">• <strong>Dimensione file:</strong> ~180 MB compressi</li>
           <li>• <strong>Origine:</strong> Alex Krizhevsky, Vinod Nair, Geoffrey Hinton</li>
       </ul>
   </div>

   <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
       <h2 style="color: #3498db; font-size: 22px; margin-bottom: 15px;">SVHN</h2>
       <p style="font-size: 16px; margin-bottom: 15px;">
           Dataset di numeri civici estratti da Google Street View.
       </p>
       <ul style="list-style-type: none; padding-left: 0;">
           <li style="margin-bottom: 8px;">• <strong>Dimensione:</strong> >600.000 immagini (73.257 training + 26.032 test + 531.131 extra)</li>
           <li style="margin-bottom: 8px;">• <strong>Formato immagini:</strong> 32x32 pixel, RGB</li>
           <li style="margin-bottom: 8px;">• <strong>Classi:</strong> 10 (cifre da 0 a 9)</li>
           <li style="margin-bottom: 8px;">• <strong>Formato dati:</strong> MATLAB/Numpy array</li>
           <li style="margin-bottom: 8px;">• <strong>Dimensione file:</strong> ~2.5 GB (incluso dataset extra)</li>
           <li>• <strong>Origine:</strong> Yuval Netzer, Tao Wang, Adam Coates, Alessandro Bissacco, Bo Wu, Andrew Y. Ng</li>
       </ul>
   </div>
</div>