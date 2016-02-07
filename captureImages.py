import pygame.camera
import pygame.image
import os
from itertools import cycle


def main():
    pygame.camera.init()
    cam = pygame.camera.Camera(pygame.camera.list_cameras()[0], (400, 300))
    cam.start()

    counter = cycle(range(5))

    relativePath = os.path.dirname(os.path.abspath(__file__))
    print(relativePath)
    link_path = os.path.join(relativePath, 'public/stream/image_stream.jpg')

    for count in counter:
        tmp_path = os.path.join(relativePath, 'public/stream/image_stream' + str(count) + '.jpg')
        pygame.image.save(cam.get_image(), tmp_path)
        os.remove(link_path)
        os.symlink(tmp_path, link_path)
        print(count)

    pygame.camera.quit()

if __name__ == "__main__":
    main()
