using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;

[RequireComponent(typeof(Canvas))]
public class CosmosHubTattooHDRP : MonoBehaviour
{
    private List<Node> nodes = new List<Node>();
    private List<LineRenderer> edges = new List<LineRenderer>();
    private int nodeCount = 4; // Default
    private Canvas canvas;
    private Text label;

    class Node
    {
        public GameObject gameObject;
        public Vector2 position;
        public Vector2 velocity;
        public Color color;
    }

    void Start()
    {
        // Setup scene
        SetupCameraAndLighting();
        SetupPostProcessing();
        SetupUI();
        GenerateCompleteGraph(nodeCount);
        RenderGraph();
    }

    void Update()
    {
        Simulate();
        UpdatePositions();
    }

    void SetupCameraAndLighting()
    {
        // Camera
        GameObject camObj = new GameObject("MainCamera");
        camObj.tag = "MainCamera";
        Camera cam = camObj.AddComponent<Camera>();
        cam.orthographic = true;
        cam.orthographicSize = 5;
        cam.transform.position = new Vector3(0, 0, -10);
        cam.clearFlags = CameraClearFlags.SolidColor;
        cam.backgroundColor = new Color(0.05f, 0.02f, 0.1f); // #0D041A

        // Directional Light (required for HDRP)
        GameObject lightObj = new GameObject("DirectionalLight");
        Light light = lightObj.AddComponent<Light>();
        light.type = LightType.Directional;
        light.transform.position = new Vector3(0, 0, -1);
        light.intensity = 1;
    }

    void SetupPostProcessing()
    {
        // Volume for HDRP post-processing
        GameObject volumeObj = new GameObject("GlobalVolume");
        UnityEngine.Rendering.Volume volume = volumeObj.AddComponent<UnityEngine.Rendering.Volume>();
        volume.isGlobal = true;
        UnityEngine.Rendering.VolumeProfile profile = ScriptableObject.CreateInstance<UnityEngine.Rendering.VolumeProfile>();
        volume.sharedProfile = profile;

        // Add Bloom
        UnityEngine.Rendering.HighDefinition.Bloom bloom = profile.Add<UnityEngine.Rendering.HighDefinition.Bloom>();
        bloom.intensity.value = 1.5f;
        bloom.threshold.value = 0.8f;

        // Add Vignette
        UnityEngine.Rendering.HighDefinition.Vignette vignette = profile.Add<UnityEngine.Rendering.HighDefinition.Vignette>();
        vignette.intensity.value = 0.4f;
    }

    void SetupUI()
    {
        // Canvas
        canvas = gameObject.GetComponent<Canvas>();
        if (canvas == null) canvas = gameObject.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        gameObject.AddComponent<CanvasScaler>();
        gameObject.AddComponent<GraphicRaycaster>();

        // Font (fallback to default if Orbitron not imported)
        Font font = Resources.GetBuiltinResource<Font>("Arial.ttf");

        // Buttons
        CreateButton("1 Node", new Vector2(20, -20), () => SetNodeCount(1));
        CreateButton("4 Nodes", new Vector2(120, -20), () => SetNodeCount(4));
        CreateButton("69 Nodes", new Vector2(220, -20), () => SetNodeCount(69));
        CreateButton("Save Tattoo", new Vector2(340, -20), ExportTattoo);

        // Label
        GameObject labelObj = new GameObject("Label");
        labelObj.transform.SetParent(canvas.transform, false);
        label = labelObj.AddComponent<Text>();
        label.text = "Kn = 4";
        label.font = font;
        label.fontSize = 35;
        label.color = new Color(1, 0.84f, 0); // #FFD700
        label.rectTransform.anchoredPosition = new Vector2(50, -40);
        label.rectTransform.anchorMin = new Vector2(0, 0);
        label.rectTransform.anchorMax = new Vector2(0, 0);
        label.rectTransform.sizeDelta = new Vector2(200, 50);
    }

    void CreateButton(string text, Vector2 pos, UnityEngine.Events.UnityAction onClick)
    {
        GameObject btnObj = new GameObject(text);
        btnObj.transform.SetParent(canvas.transform, false);
        Image img = btnObj.AddComponent<Image>();
        img.color = new Color(0.1f, 0.1f, 0.1f, 0.8f);
        Button btn = btnObj.AddComponent<Button>();
        btn.onClick.AddListener(onClick);

        GameObject txtObj = new GameObject("Text");
        txtObj.transform.SetParent(btnObj.transform, false);
        Text txt = txtObj.AddComponent<Text>();
        txt.text = text;
        txt.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
        txt.fontSize = 20;
        txt.color = new Color(1, 0.84f, 0); // #FFD700
        txt.alignment = TextAnchor.MiddleCenter;

        RectTransform btnRect = btnObj.GetComponent<RectTransform>();
        btnRect.anchoredPosition = pos;
        btnRect.anchorMin = new Vector2(0, 1);
        btnRect.anchorMax = new Vector2(0, 1);
        btnRect.sizeDelta = new Vector2(90, 30);

        RectTransform txtRect = txtObj.GetComponent<RectTransform>();
        txtRect.sizeDelta = btnRect.sizeDelta;
    }

    void GenerateCompleteGraph(int n)
    {
        nodes.Clear();
        edges.Clear();

        for (int i = 0; i < n; i++)
        {
            nodes.Add(new Node
            {
                position = new Vector2(Random.Range(-5f, 5f), Random.Range(-5f, 5f)),
                velocity = new Vector2(Random.Range(-0.1f, 0.1f), Random.Range(-0.1f, 0.1f)),
                color = Random.ColorHSV(0f, 1f, 0.8f, 1f, 0.7f, 1f)
            });
        }

        for (int u = 0; u < n; u++)
        {
            for (int v = u + 1; v < n; v++)
            {
                GameObject edgeObj = new GameObject($"Edge_{u}_{v}");
                edgeObj.transform.parent = transform;
                LineRenderer line = edgeObj.AddComponent<LineRenderer>();
                line.positionCount = 2;
                line.startWidth = 0.02f;
                line.endWidth = 0.02f;
                line.material = new Material(Shader.Find("HDRP/Unlit"));
                line.material.SetInt("_UseVertexColor", 1); // Enable vertex colors
                line.startColor = nodes[u].color;
                line.endColor = nodes[v].color;
                edges.Add(line);
            }
        }

        nodeCount = n;
        label.text = $"Kn = {n}";
    }

    void RenderGraph()
    {
        foreach (var node in nodes)
        {
            if (node.gameObject != null) Destroy(node.gameObject);
        }

        foreach (var node in nodes)
        {
            node.gameObject = new GameObject("Node");
            node.gameObject.transform.parent = transform;
            SpriteRenderer sr = node.gameObject.AddComponent<SpriteRenderer>();
            sr.sprite = CreateCircleSprite(16); // 16x16 pixel circle
            Material mat = new Material(Shader.Find("HDRP/Lit"));
            mat.SetColor("_BaseColor", node.color);
            mat.SetColor("_EmissiveColor", node.color * 5);
            mat.EnableKeyword("_EMISSION");
            sr.material = mat;
            node.gameObject.transform.position = new Vector3(node.position.x, node.position.y, 0);
            node.gameObject.transform.localScale = Vector3.one * 0.2f;
        }

        int edgeIndex = 0;
        for (int u = 0; u < nodes.Count; u++)
        {
            for (int v = u + 1; v < nodes.Count; v++)
            {
                edges[edgeIndex].SetPosition(0, new Vector3(nodes[u].position.x, nodes[u].position.y, 0));
                edges[edgeIndex].SetPosition(1, new Vector3(nodes[v].position.x, nodes[v].position.y, 0));
                edgeIndex++;
            }
        }
    }

    Sprite CreateCircleSprite(int size)
    {
        Texture2D tex = new Texture2D(size, size);
        for (int y = 0; y < size; y++)
        {
            for (int x = 0; x < size; x++)
            {
                float dx = x - size / 2f;
                float dy = y - size / 2f;
                if (dx * dx + dy * dy < (size / 2f) * (size / 2f))
                    tex.SetPixel(x, y, Color.white);
                else
                    tex.SetPixel(x, y, Color.clear);
            }
        }
        tex.Apply();
        return Sprite.Create(tex, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f));
    }

    void Simulate()
    {
        float charge = -10f;
        float linkDistance = 1f;
        float damping = 0.95f;

        foreach (var node in nodes)
        {
            Vector2 force = Vector2.zero;

            foreach (var other in nodes)
            {
                if (node != other)
                {
                    Vector2 diff = node.position - other.position;
                    float dist = Mathf.Max(diff.magnitude, 0.1f);
                    force += (diff.normalized * charge) / (dist * dist);
                }
            }

            for (int u = 0; u < nodes.Count; u++)
            {
                for (int v = u + 1; v < nodes.Count; v++)
                {
                    if (nodes[u] == node || nodes[v] == node)
                    {
                        var other = nodes[u] == node ? nodes[v] : nodes[u];
                        Vector2 diff = other.position - node.position;
                        float dist = diff.magnitude;
                        force += diff.normalized * (dist - linkDistance) * 0.1f;
                    }
                }
            }

            node.velocity += force * Time.deltaTime;
            node.velocity *= damping;
            node.position += node.velocity * Time.deltaTime;
        }
    }

    void UpdatePositions()
    {
        foreach (var node in nodes)
        {
            node.gameObject.transform.position = new Vector3(node.position.x, node.position.y, 0);
        }

        int edgeIndex = 0;
        for (int u = 0; u < nodes.Count; u++)
        {
            for (int v = u + 1; v < nodes.Count; v++)
            {
                edges[edgeIndex].SetPosition(0, new Vector3(nodes[u].position.x, nodes[u].position.y, 0));
                edges[edgeIndex].SetPosition(1, new Vector3(nodes[v].position.x, nodes[v].position.y, 0));
                edgeIndex++;
            }
        }
    }

    public void SetNodeCount(int n)
    {
        GenerateCompleteGraph(n);
        RenderGraph();
    }

    public void ExportTattoo()
    {
        RenderTexture rt = new RenderTexture(1920, 1080, 24);
        Camera.main.targetTexture = rt;
        Camera.main.Render();
        RenderTexture.active = rt;
        Texture2D tex = new Texture2D(1920, 1080, TextureFormat.RGB24, false);
        tex.ReadPixels(new Rect(0, 0, 1920, 1080), 0, 0);
        tex.Apply();
        byte[] bytes = tex.EncodeToPNG();
        string path = Application.dataPath + "/CosmosHubTattooHDRP.png";
        System.IO.File.WriteAllBytes(path, bytes);
        Camera.main.targetTexture = null;
        RenderTexture.active = null;
        Destroy(rt);
        Debug.Log("Tattoo saved to " + path);
    }
}